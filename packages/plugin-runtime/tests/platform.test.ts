import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CanvasRegistry, CommunityEntitlementProvider } from '@biaomai/plugin-sdk';
import { PackLoader, PermissionGuard, RegionRouter } from '@biaomai/plugin-runtime';
import {
  IsolatedSessionManager,
  buildAgentBrowserMcpConfig,
  createCompliantPrefillCommand,
  sanitizeComments,
  scoreExtractedComments,
} from '@biaomai/ai-browser';
import { LeadCrmStore } from '../../../packs/pack-leadgen-ops/core/lead-crm-store.js';
import { computeChannelRoi } from '../../../packs/pack-leadgen-ops/core/attribution-service.js';

const ROOT = path.resolve(import.meta.dirname, '../../..');

describe('Micro-Kernel Plugin Loader & CanvasRegistry', () => {
  it('hot-loads pack-leadgen-ops and pack-template and unregisters cleanly', () => {
    const registry = new CanvasRegistry();
    const loader = new PackLoader(registry);

    const leadgen = loader.loadFromDirectory(path.join(ROOT, 'packs/pack-leadgen-ops'));
    expect(leadgen.manifest.name).toBe('pack-leadgen-ops');
    expect(leadgen.manifest.contributes.assistants).toHaveLength(5);
    expect(registry.listByPack('pack-leadgen-ops')).toHaveLength(4);
    expect(registry.resolveForAssistant('intent-radar-copilot')?.id).toBe('browser-radar-canvas');

    const tpl = loader.loadFromDirectory(path.join(ROOT, 'packs/pack-template'));
    expect(tpl.manifest.category).toBe('local-office');
    expect(registry.listAll()).toHaveLength(5);

    expect(loader.unload('pack-template')).toBe(true);
    expect(registry.listAll()).toHaveLength(4);
  });

  it('provides unrestricted local community entitlement by default', async () => {
    const provider = new CommunityEntitlementProvider();
    const snap = await provider.getSnapshot();
    expect(snap.tier).toBe('community');
    expect(await provider.hasFeature('enterprise.sso_rbac')).toBe(false);
  });
});

describe('PermissionGuard ToB Sandbox', () => {
  it('enforces declared domains, paths, and mandatory external write approval', () => {
    const guard = new PermissionGuard();
    const manifest = {
      fsReadPaths: ['./drafts'],
      fsWritePaths: ['./exports'],
      netDomains: ['aitoearn.ai'],
      browserCdp: true,
      shellExec: false,
      imNotify: true,
      defaultApproval: 'ask-once' as const,
      alwaysAskActions: ['publish_now'],
    };

    expect(guard.evaluate('pack-leadgen-ops', manifest, { kind: 'net.request', domain: 'api.aitoearn.ai' }).status).toBe('allow');
    expect(guard.evaluate('pack-leadgen-ops', manifest, { kind: 'net.request', domain: 'evil.example.com' }).status).toBe('deny');
    expect(guard.evaluate('pack-leadgen-ops', manifest, { kind: 'shell.exec', command: 'rm -rf /' }).status).toBe('deny');
    expect(guard.evaluate('pack-leadgen-ops', manifest, { kind: 'external.write', actionName: 'publish_now' }).status).toBe('require-approval');
    expect(guard.getAuditLog().length).toBe(4);
  });
});

describe('Dual-Region & Bilingual RegionRouter', () => {
  it('decouples region from locale (4-combination matrix) and detects 401 key mismatch', () => {
    const router = new RegionRouter();
    router.loadProfilesFromDir(path.join(ROOT, 'config'));

    router.setRegion('global-official', true);
    expect(router.getActiveLocale()).toBe('en-US');
    expect(router.getActiveProfile().platforms).toHaveLength(8);

    // Global + zh-CN (cross-border seller mode)
    router.setLocale('zh-CN');
    expect(router.getActiveProfile().id).toBe('global-official');
    expect(router.getActiveLocale()).toBe('zh-CN');

    // Region-key mismatch detection
    const diag = router.diagnoseAuthMismatch('cn_live_secret_123');
    expect(diag.isMismatch).toBe(true);
    expect(diag.suggestedRegion).toBe('cn-official');

    // Per-region isolated API keys
    router.setApiKey('cn-official', 'cn_key_1');
    router.setApiKey('global-official', 'gl_key_2');
    expect(router.getApiKey('cn-official')).toBe('cn_key_1');
    expect(router.getApiKey('global-official')).toBe('gl_key_2');
  });
});

describe('AI-Native Embedded Browser & Compliance', () => {
  it('isolates multi-account partitions and generates agent-browser MCP config', () => {
    const mgr = new IsolatedSessionManager(19220);
    const s1 = mgr.createOrGet('xiaohongshu', 'brand-main', 'XHS Main');
    const s2 = mgr.createOrGet('tiktok', 'us-01', 'TikTok US');

    expect(s1.partition).toBe('persist:bm-acc-xiaohongshu-brand-main');
    expect(s2.partition).toBe('persist:bm-acc-tiktok-us-01');
    expect(s1.cdpPort).not.toBe(s2.cdpPort);

    const mcp = buildAgentBrowserMcpConfig(s2);
    expect(mcp.command).toBe('npx');
    expect(mcp.cdpEndpoint).toBe(`http://127.0.0.1:${s2.cdpPort}`);
  });

  it('strips all PII from comments and enforces stopBeforeSubmit on replies', () => {
    const clean = sanitizeComments([
      {
        commentId: 'c1',
        nickname: 'Alice 13812345678',
        content: '怎么收费？加我微信 wx_alice99 或者发 test@example.com 链接 https://evil.test/u/1',
        likeCount: 12,
        profileUrl: 'https://xhs.com/user/secret-uid',
        uid: 'secret-uid-999',
      },
    ]);

    expect(clean[0].content).not.toContain('wx_alice99');
    expect(clean[0].content).not.toContain('test@example.com');
    expect(clean[0].content).not.toContain('https://evil.test');
    expect(clean[0].nickname).not.toContain('13812345678');
    expect('uid' in clean[0]).toBe(false);
    expect('profileUrl' in clean[0]).toBe(false);

    const scored = scoreExtractedComments([
      { commentId: 'c1', nickname: 'Buyer', content: '请问私有化怎么收费？求报价', likeCount: 5 },
      { commentId: 'c2', nickname: 'Fan', content: '赞', likeCount: 1 },
    ]);
    expect(scored[0].tier).toBe('S');
    expect(scored[0].intentScore).toBeGreaterThanOrEqual(85);

    const cmd = createCompliantPrefillCommand('c1', '您好，欢迎查看置顶方案');
    expect(cmd.stopBeforeSubmit).toBe(true);
  });
});

describe('Lead CRM & Short-Link ROI Attribution', () => {
  it('deduplicates leads, tracks 5-stage pipeline, and computes channel ROI', () => {
    const crm = new LeadCrmStore();
    const l1 = crm.addLead({
      platform: 'tiktok',
      sourcePostId: 'post-101',
      shortLinkId: 'sl-tt-1',
      nickname: 'GlobalBuyer',
      sanitizedComment: 'How much for the enterprise license?',
      intentTier: 'S',
      intentScore: 95,
    });
    const dup = crm.addLead({
      platform: 'tiktok',
      sourcePostId: 'post-101',
      shortLinkId: 'sl-tt-1',
      nickname: 'GlobalBuyer',
      sanitizedComment: 'How much for the enterprise license?',
      intentTier: 'S',
      intentScore: 95,
    });
    expect(dup.id).toBe(l1.id);

    crm.updateStage(l1.id, 'won', 4900);
    expect(crm.listByStage('won')).toHaveLength(1);
    expect(crm.exportCsv()).toContain('GlobalBuyer');

    const roi = computeChannelRoi(
      [{ shortLinkId: 'sl-tt-1', platform: 'tiktok', postTitle: 'AI Lead-Gen Demo', clicks: 420 }],
      crm.listByStage(),
    );
    expect(roi[0].platform).toBe('tiktok');
    expect(roi[0].wonDeals).toBe(1);
    expect(roi[0].revenue).toBe(4900);
    expect(roi[0].conversionRate).toBe(1);
  });
});
