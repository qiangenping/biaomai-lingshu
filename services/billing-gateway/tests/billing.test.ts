import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BillingLedgerStore } from '../src/license-store.js';
import { createBillingGateway } from '../src/server.js';

describe('Commercial C/S Billing & Relay Gateway', () => {
  let upstreamMcp: http.Server;
  let upstreamPort = 0;
  let gateway: ReturnType<typeof createBillingGateway>;
  let gatewayUrl = '';

  beforeAll(async () => {
    upstreamMcp = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        const body = JSON.parse(raw);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: { proxied: true, method: body.method, isError: body.params?.name === 'fails' } }));
      });
    });
    await new Promise<void>((resolve) => {
      upstreamMcp.listen(0, '127.0.0.1', () => {
        const addr = upstreamMcp.address();
        upstreamPort = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });

    gateway = createBillingGateway({
      port: 0,
      ledgerPath: ':memory:',
      region: 'global-official',
      upstreamMcpUrl: `http://127.0.0.1:${upstreamPort}/api/unified/mcp`,
      signingSecret: 'test-hmac-secret',
      adminToken: 'test-admin',
    });
    const gwPort = await gateway.start();
    gatewayUrl = `http://127.0.0.1:${gwPort}`;
  });

  afterAll(async () => {
    await gateway.close();
    await new Promise<void>((resolve) => upstreamMcp.close(() => resolve()));
  });

  it('requires trusted fulfillment and refunds a failed upstream tool result', async () => {
    const unsigned = await fetch(`${gatewayUrl}/v1/webhooks/stripe`, { method: 'POST' });
    expect(unsigned.status).toBe(401);
    const account = gateway.ledger.issueApiKey({ userId: 'refund-test', email: '', region: 'global-official', tier: 'pro' });
    const before = account.creditsBalance;
    const response = await fetch(`${gatewayUrl}/api/unified/mcp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': account.apiKey },
      body: JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'fails' } }),
    });
    expect((await response.json()).result.isError).toBe(true);
    expect(account.creditsBalance).toBe(before);
  });

  it('provisions Global key via Stripe webhook, enforces credits & 401/402, and proxies MCP calls', async () => {
    // 1. Stripe webhook issues gl_ key with Pro tier + 1000 credits
    const stripeRes = await fetch(`${gatewayUrl}/v1/webhooks/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': 'test-admin' },
      body: JSON.stringify({ customerId: 'cus_1', customerEmail: 'founder@global.io', tier: 'pro' }),
    }).then((r) => r.json());
    expect(stripeRes.received).toBe(true);
    expect(stripeRes.issuedApiKey.startsWith('gl_')).toBe(true);
    expect(stripeRes.creditsBalance).toBe(1000);

    // 2. Entitlement endpoint returns Pro snapshot
    const ent = await fetch(`${gatewayUrl}/v1/account/entitlement`, {
      headers: { 'x-api-key': stripeRes.issuedApiKey },
    }).then((r) => r.json());
    expect(ent.tier).toBe('pro');
    expect(ent.enabledFeatures).toContain('cloud.server_relay');

    // 3. Proxied MCP tools/call succeeds and deducts 1 credit
    const mcpRes = await fetch(`${gatewayUrl}/api/unified/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': stripeRes.issuedApiKey },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'channel_publish' } }),
    }).then((r) => r.json());
    expect(mcpRes.result.proxied).toBe(true);
    expect(gateway.ledger.getByApiKey(stripeRes.issuedApiKey)?.creditsBalance).toBe(999);

    // 4. WeChat webhook issues cn_ key -> rejected with 401 on Global gateway
    const wxRes = await fetch(`${gatewayUrl}/v1/webhooks/wechat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': 'test-admin' },
      body: JSON.stringify({ openId: 'wx_open_1', tier: 'team' }),
    }).then((r) => r.json());
    expect(wxRes.issuedApiKey.startsWith('cn_')).toBe(true);

    const mismatchRes = await fetch(`${gatewayUrl}/v1/account/entitlement`, {
      headers: { 'x-api-key': wxRes.issuedApiKey },
    });
    expect(mismatchRes.status).toBe(401);

    // 5. Deplete credits -> 402 Payment Required on tools/call
    gateway.ledger.deductCredits(stripeRes.issuedApiKey, 999);
    const exhaustedRes = await fetch(`${gatewayUrl}/api/unified/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': stripeRes.issuedApiKey },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'video_gen' } }),
    });
    expect(exhaustedRes.status).toBe(402);
  });

  it('signs, verifies, and detects tampering on offline Enterprise HMAC licenses', async () => {
    const issueRes = await fetch(`${gatewayUrl}/v1/enterprise/issue-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': 'test-admin' },
      body: JSON.stringify({ orgName: 'Acme Corp', tier: 'enterprise', maxSeats: 200, durationDays: 365 }),
    }).then((r) => r.json());
    expect(issueRes.licenseKey).toContain('.');

    const ok = await fetch(`${gatewayUrl}/v1/enterprise/verify-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: issueRes.licenseKey }),
    }).then((r) => r.json());
    expect(ok.valid).toBe(true);
    expect(ok.payload.orgName).toBe('Acme Corp');

    // Tampered token must fail verification
    const tampered = BillingLedgerStore.verifyOfflineLicense(`${issueRes.licenseKey}x`, 'test-hmac-secret');
    expect(tampered.valid).toBe(false);
  });
});
