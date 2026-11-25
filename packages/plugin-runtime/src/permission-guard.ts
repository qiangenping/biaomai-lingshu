import path from 'node:path';
import type { ApprovalPolicy, PermissionManifest } from '@biaomai/plugin-sdk';

export type PermissionAction =
  | { kind: 'fs.read'; targetPath: string }
  | { kind: 'fs.write'; targetPath: string }
  | { kind: 'net.request'; domain: string }
  | { kind: 'browser.cdp'; actionName: string }
  | { kind: 'shell.exec'; command: string }
  | { kind: 'external.write'; actionName: string };

export interface PermissionDecision {
  status: 'allow' | 'require-approval' | 'deny';
  reason: string;
  policy?: ApprovalPolicy;
}

export interface AuditRecord {
  timestamp: string;
  packName: string;
  action: PermissionAction;
  decision: PermissionDecision;
}

/**
 * ToB-grade declarative permission sandbox & 3-tier approval gate.
 * Prevents undeclared file/domain/shell access and enforces Human-in-the-Loop approval on external writes.
 */
export class PermissionGuard {
  private readonly auditLog: AuditRecord[] = [];
  private readonly sessionApproved = new Set<string>();

  evaluate(packName: string, manifest: PermissionManifest, action: PermissionAction): PermissionDecision {
    const decision = this.check(packName, manifest, action);
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      packName,
      action,
      decision,
    });
    return decision;
  }

  approveForSession(packName: string, actionKey: string): void {
    this.sessionApproved.add(`${packName}:${actionKey}`);
  }

  getAuditLog(): readonly AuditRecord[] {
    return this.auditLog;
  }

  private check(packName: string, manifest: PermissionManifest, action: PermissionAction): PermissionDecision {
    switch (action.kind) {
      case 'fs.read': {
        const resolved = path.resolve(action.targetPath);
        const allowed = manifest.fsReadPaths.some((p) => resolved.startsWith(path.resolve(p)));
        return allowed
          ? { status: 'allow', reason: 'Path within declared fsReadPaths' }
          : { status: 'deny', reason: `Undeclared fs.read path: ${action.targetPath}` };
      }
      case 'fs.write': {
        const resolved = path.resolve(action.targetPath);
        const allowed = manifest.fsWritePaths.some((p) => resolved.startsWith(path.resolve(p)));
        if (!allowed) {
          return { status: 'deny', reason: `Undeclared fs.write path: ${action.targetPath}` };
        }
        return this.applyApproval(packName, `fs.write:${resolved}`, manifest.defaultApproval);
      }
      case 'net.request': {
        const domain = action.domain.toLowerCase();
        const allowed = manifest.netDomains.some((d) => {
          const norm = d.toLowerCase();
          return domain === norm || domain.endsWith(`.${norm}`);
        });
        return allowed
          ? { status: 'allow', reason: 'Domain within declared netDomains' }
          : { status: 'deny', reason: `Undeclared network domain: ${action.domain}` };
      }
      case 'browser.cdp': {
        if (!manifest.browserCdp) {
          return { status: 'deny', reason: 'Pack did not declare browserCdp permission' };
        }
        if (manifest.alwaysAskActions.includes(action.actionName)) {
          return { status: 'require-approval', reason: `Action "${action.actionName}" requires explicit approval`, policy: 'always-ask' };
        }
        return this.applyApproval(packName, `browser.cdp:${action.actionName}`, manifest.defaultApproval);
      }
      case 'shell.exec': {
        if (!manifest.shellExec) {
          return { status: 'deny', reason: 'Pack did not declare shellExec permission' };
        }
        return { status: 'require-approval', reason: 'Shell execution always requires approval', policy: 'always-ask' };
      }
      case 'external.write': {
        // Hard compliance gate: external publishing / comment sending always requires human confirmation
        return {
          status: 'require-approval',
          reason: `External write "${action.actionName}" requires Human-in-the-Loop confirmation`,
          policy: 'always-ask',
        };
      }
    }
  }

  private applyApproval(packName: string, actionKey: string, policy: ApprovalPolicy): PermissionDecision {
    if (policy === 'auto') {
      return { status: 'allow', reason: 'Policy is auto', policy };
    }
    if (policy === 'ask-once' && this.sessionApproved.has(`${packName}:${actionKey}`)) {
      return { status: 'allow', reason: 'Previously approved in current session', policy };
    }
    return { status: 'require-approval', reason: `Policy "${policy}" requires user confirmation`, policy };
  }
}
