import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { CommercialFeatureFlag, EditionTier, RegionId } from '@biaomai/plugin-sdk';

export interface TenantAccount {
  apiKey: string;
  userId: string;
  email: string;
  region: Exclude<RegionId, 'self-hosted'>;
  tier: EditionTier;
  creditsBalance: number;
  maxSocialAccounts: number;
  maxSeats: number;
  enabledFeatures: CommercialFeatureFlag[];
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineEnterpriseLicensePayload {
  licenseId: string;
  orgName: string;
  tier: 'enterprise' | 'oem';
  maxSeats: number;
  expiresAt: string;
  issuedAt: string;
}

const TIER_DEFAULTS: Record<
  EditionTier,
  { maxSocialAccounts: number; maxSeats: number; monthlyCredits: number; features: CommercialFeatureFlag[] }
> = {
  community: { maxSocialAccounts: 3, maxSeats: 1, monthlyCredits: 100, features: [] },
  pro: {
    maxSocialAccounts: 15,
    maxSeats: 1,
    monthlyCredits: 1000,
    features: ['cloud.server_relay', 'cloud.ai_relay_credits', 'cloud.cron_24_7'],
  },
  team: {
    maxSocialAccounts: 50,
    maxSeats: 5,
    monthlyCredits: 5000,
    features: [
      'cloud.server_relay',
      'cloud.ai_relay_credits',
      'cloud.cron_24_7',
      'team.shared_crm',
      'team.im_approval_flow',
    ],
  },
  enterprise: {
    maxSocialAccounts: 500,
    maxSeats: 100,
    monthlyCredits: 50000,
    features: [
      'cloud.server_relay',
      'cloud.ai_relay_credits',
      'cloud.cron_24_7',
      'team.shared_crm',
      'team.im_approval_flow',
      'enterprise.sso_rbac',
      'enterprise.private_registry',
      'enterprise.scrm_connectors',
      'enterprise.ad_compliance_guard',
    ],
  },
  oem: {
    maxSocialAccounts: 2000,
    maxSeats: 500,
    monthlyCredits: 200000,
    features: [
      'cloud.server_relay',
      'cloud.ai_relay_credits',
      'cloud.cron_24_7',
      'team.shared_crm',
      'team.im_approval_flow',
      'enterprise.sso_rbac',
      'enterprise.private_registry',
      'enterprise.scrm_connectors',
      'enterprise.ad_compliance_guard',
      'oem.white_label',
    ],
  },
};

/**
 * Durable Billing & Entitlement Ledger for C/S SaaS monetization.
 * Issues region-prefixed API keys (cn_ / gl_), tracks AI credits, and signs offline Enterprise licenses.
 */
export class BillingLedgerStore {
  private readonly accounts = new Map<string, TenantAccount>();
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    if (filePath !== ':memory:' && fs.existsSync(filePath)) {
      const list = JSON.parse(fs.readFileSync(filePath, 'utf8')) as TenantAccount[];
      for (const acc of list) this.accounts.set(acc.apiKey, acc);
    }
  }

  private flush(): void {
    if (this.filePath === ':memory:') return;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(Array.from(this.accounts.values()), null, 2), 'utf8');
    fs.renameSync(tmp, this.filePath);
  }

  issueApiKey(params: {
    userId: string;
    email: string;
    region: Exclude<RegionId, 'self-hosted'>;
    tier: EditionTier;
    extraCredits?: number;
    durationDays?: number;
  }): TenantAccount {
    const prefix = params.region === 'cn-official' ? 'cn_' : 'gl_';
    const apiKey = `${prefix}${crypto.randomBytes(24).toString('hex')}`;
    const defaults = TIER_DEFAULTS[params.tier];
    const now = new Date();
    const expiresAt = params.durationDays
      ? new Date(now.getTime() + params.durationDays * 86400_000).toISOString()
      : null;

    const account: TenantAccount = {
      apiKey,
      userId: params.userId,
      email: params.email,
      region: params.region,
      tier: params.tier,
      creditsBalance: defaults.monthlyCredits + (params.extraCredits ?? 0),
      maxSocialAccounts: defaults.maxSocialAccounts,
      maxSeats: defaults.maxSeats,
      enabledFeatures: [...defaults.features],
      expiresAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.accounts.set(apiKey, account);
    this.flush();
    return account;
  }

  getByApiKey(apiKey: string): TenantAccount | undefined {
    const account = this.accounts.get(apiKey);
    if (account?.expiresAt && Date.parse(account.expiresAt) <= Date.now()) return undefined;
    return account;
  }

  addCredits(apiKey: string, amount: number): TenantAccount {
    const acc = this.accounts.get(apiKey);
    if (!acc) throw new Error('Account not found');
    acc.creditsBalance += Math.max(0, amount);
    acc.updatedAt = new Date().toISOString();
    this.flush();
    return acc;
  }

  deductCredits(apiKey: string, cost: number): { ok: boolean; remaining: number } {
    const acc = this.accounts.get(apiKey);
    if (!acc) return { ok: false, remaining: 0 };
    if (acc.creditsBalance < cost) {
      return { ok: false, remaining: acc.creditsBalance };
    }
    acc.creditsBalance -= cost;
    acc.updatedAt = new Date().toISOString();
    this.flush();
    return { ok: true, remaining: acc.creditsBalance };
  }

  static signOfflineLicense(payload: OfflineEnterpriseLicensePayload, signingSecret: string): string {
    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', signingSecret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  static verifyOfflineLicense(
    token: string,
    signingSecret: string,
  ): { valid: boolean; payload?: OfflineEnterpriseLicensePayload; reason?: string } {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false, reason: 'Malformed license token' };
    const [body, sig] = parts;
    const expected = crypto.createHmac('sha256', signingSecret).update(body).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: 'Invalid signature' };
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as OfflineEnterpriseLicensePayload;
    if (new Date(payload.expiresAt).getTime() < Date.now()) {
      return { valid: false, payload, reason: 'License expired' };
    }
    return { valid: true, payload };
  }
}
