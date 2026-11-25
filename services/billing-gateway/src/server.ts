import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EditionTier, RegionId } from '@biaomai/plugin-sdk';
import { BillingLedgerStore, type OfflineEnterpriseLicensePayload } from './license-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface BillingGatewayOptions {
  port?: number;
  ledgerPath?: string;
  upstreamMcpUrl?: string;
  region?: Exclude<RegionId, 'self-hosted'>;
  signingSecret?: string;
  adminToken?: string;
}

function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

/**
 * Commercial C/S Billing & Relay Gateway.
 * Sits in front of AiToEarn (aitoearn-server / aitoearn-ai) to monetize via:
 * - Global USD subscriptions & credit packs (Stripe / Paddle webhook)
 * - China RMB subscriptions & credit packs (WeChat Pay / Alipay webhook)
 * - Offline HMAC-signed Enterprise & OEM licenses
 * - Quota & credit gated MCP reverse proxy
 */
export function createBillingGateway(options: BillingGatewayOptions = {}) {
  const region = options.region ?? ((process.env.BIAOMAI_GATEWAY_REGION as Exclude<RegionId, 'self-hosted'>) || 'global-official');
  const upstreamMcpUrl = options.upstreamMcpUrl ?? process.env.UPSTREAM_MCP_URL ?? 'http://127.0.0.1:8080/api/unified/mcp';
  const signingSecret = options.signingSecret ?? process.env.LICENSE_SIGNING_SECRET ?? 'dev-replace-in-production';
  const adminToken = options.adminToken ?? process.env.BILLING_ADMIN_TOKEN ?? 'dev-admin-token';
  const ledgerPath = options.ledgerPath ?? path.resolve(__dirname, '../../../.biaomai-data/billing-ledger.json');
  const ledger = new BillingLedgerStore(ledgerPath);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const pathname = url.pathname;

    try {
      if (req.method === 'GET' && pathname === '/healthz') {
        return sendJson(res, 200, { ok: true, service: 'biaomai-billing-gateway', region });
      }

      // 1. Admin manual key issuance
      if (req.method === 'POST' && pathname === '/v1/admin/issue-key') {
        if (req.headers['x-admin-token'] !== adminToken) {
          return sendJson(res, 401, { error: 'Invalid admin token' });
        }
        const body = await readJson(req);
        const account = ledger.issueApiKey({
          userId: String(body.userId || 'usr'),
          email: String(body.email || ''),
          region: (body.region as Exclude<RegionId, 'self-hosted'>) || region,
          tier: (body.tier as EditionTier) || 'pro',
          extraCredits: Number(body.extraCredits || 0),
          durationDays: Number(body.durationDays || 30),
        });
        return sendJson(res, 201, { account });
      }

      // 2. Global USD Payment Webhook (Stripe / Paddle checkout.session.completed)
      if (req.method === 'POST' && pathname === '/v1/webhooks/stripe') {
        const body = await readJson(req);
        const account = ledger.issueApiKey({
          userId: String(body.customerId || `stripe_${Date.now()}`),
          email: String(body.customerEmail || ''),
          region: 'global-official',
          tier: (body.tier as EditionTier) || 'pro',
          extraCredits: Number(body.creditsPack || 0),
          durationDays: Number(body.durationDays || 30),
        });
        return sendJson(res, 200, { received: true, issuedApiKey: account.apiKey, tier: account.tier, creditsBalance: account.creditsBalance });
      }

      // 3. China RMB Payment Webhook (WeChat Pay / Alipay notify)
      if (req.method === 'POST' && pathname === '/v1/webhooks/wechat') {
        const body = await readJson(req);
        const account = ledger.issueApiKey({
          userId: String(body.openId || `wx_${Date.now()}`),
          email: String(body.contact || ''),
          region: 'cn-official',
          tier: (body.tier as EditionTier) || 'pro',
          extraCredits: Number(body.creditsPack || 0),
          durationDays: Number(body.durationDays || 30),
        });
        return sendJson(res, 200, { code: 'SUCCESS', issuedApiKey: account.apiKey, tier: account.tier, creditsBalance: account.creditsBalance });
      }

      // 4. Offline Enterprise / OEM License Issuer & Verifier
      if (req.method === 'POST' && pathname === '/v1/enterprise/issue-license') {
        if (req.headers['x-admin-token'] !== adminToken) {
          return sendJson(res, 401, { error: 'Invalid admin token' });
        }
        const body = await readJson(req);
        const days = Number(body.durationDays || 365);
        const now = new Date();
        const payload: OfflineEnterpriseLicensePayload = {
          licenseId: `lic_${Date.now()}`,
          orgName: String(body.orgName || 'Enterprise Customer'),
          tier: body.tier === 'oem' ? 'oem' : 'enterprise',
          maxSeats: Number(body.maxSeats || 100),
          issuedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + days * 86400_000).toISOString(),
        };
        const licenseKey = BillingLedgerStore.signOfflineLicense(payload, signingSecret);
        return sendJson(res, 201, { licenseKey, payload });
      }

      if (req.method === 'POST' && pathname === '/v1/enterprise/verify-license') {
        const body = await readJson(req);
        const result = BillingLedgerStore.verifyOfflineLicense(String(body.licenseKey || ''), signingSecret);
        return sendJson(res, result.valid ? 200 : 400, result);
      }

      // 5. Client Entitlement Query (powers CloudBillingEntitlementProvider)
      if (req.method === 'GET' && pathname === '/v1/account/entitlement') {
        const apiKey = String(req.headers['x-api-key'] || '');
        const acc = ledger.getByApiKey(apiKey);
        if (!acc || acc.region !== region) {
          return sendJson(res, 401, { error: 'Invalid or region-mismatched API key' });
        }
        return sendJson(res, 200, {
          tier: acc.tier,
          region: acc.region,
          creditsBalance: acc.creditsBalance,
          maxSocialAccounts: acc.maxSocialAccounts,
          maxSeats: acc.maxSeats,
          enabledFeatures: acc.enabledFeatures,
          expiresAt: acc.expiresAt,
        });
      }

      // 6. Quota & Credit-Gated MCP Reverse Proxy to AiToEarn
      if (req.method === 'POST' && pathname === '/api/unified/mcp') {
        const apiKey = String(req.headers['x-api-key'] || '');
        const acc = ledger.getByApiKey(apiKey);
        if (!acc || acc.region !== region) {
          return sendJson(res, 401, { error: `Unauthorized for region ${region}` });
        }
        const body = await readJson(req);
        const isPaidToolCall = body.method === 'tools/call';
        if (isPaidToolCall) {
          const debit = ledger.deductCredits(apiKey, 1);
          if (!debit.ok) {
            return sendJson(res, 402, {
              error: 'Insufficient AI credits. Please top up your BiaoMai Cloud credits.',
              creditsBalance: debit.remaining,
            });
          }
        }

        const upstreamRes = await fetch(upstreamMcpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
          body: JSON.stringify(body),
        });
        const upstreamText = await upstreamRes.text();
        res.writeHead(upstreamRes.status, { 'Content-Type': upstreamRes.headers.get('content-type') || 'application/json' });
        res.end(upstreamText);
        return;
      }

      return sendJson(res, 404, { error: `Not found: ${pathname}` });
    } catch (err) {
      return sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
  });

  const port = options.port ?? Number(process.env.BILLING_PORT || 19900);
  return {
    server,
    ledger,
    start: () =>
      new Promise<number>((resolve) => {
        server.listen(port, '0.0.0.0', () => {
          const addr = server.address();
          resolve(typeof addr === 'object' && addr ? addr.port : port);
        });
      }),
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const gw = createBillingGateway();
  gw.start().then((p) => console.log(`✅ BiaoMai Commercial Billing Gateway listening on http://0.0.0.0:${p}`));
}
