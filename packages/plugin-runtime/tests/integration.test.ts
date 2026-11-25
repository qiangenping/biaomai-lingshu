import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { McpHttpClient } from '@biaomai/plugin-runtime';
import { SqliteWorkspaceStore } from '../../../packs/pack-leadgen-ops/core/sqlite-crm-store.js';
import { createWorkbenchApiServer } from '../../../apps/workbench/server/api-server.js';

describe('Real MCP JSON-RPC HTTP Client', () => {
  let mockMcpServer: http.Server;
  let mcpPort = 0;

  beforeAll(async () => {
    mockMcpServer = http.createServer((req, res) => {
      if (req.headers['x-api-key'] !== 'gl_valid_key') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        const body = JSON.parse(raw);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (body.method === 'tools/list') {
          res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: { tools: [{ name: 'channel_publish' }] } }));
        } else {
          res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: { ok: true, method: body.method } }));
        }
      });
    });
    await new Promise<void>((resolve) => {
      mockMcpServer.listen(0, '127.0.0.1', () => {
        const addr = mockMcpServer.address();
        mcpPort = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => mockMcpServer.close(() => resolve()));
  });

  it('lists tools over real HTTP JSON-RPC and detects HTTP 401 region-key mismatch', async () => {
    const okClient = new McpHttpClient(`http://127.0.0.1:${mcpPort}/mcp`, 'gl_valid_key');
    const listRes = await okClient.pingAndListTools();
    expect(listRes.ok).toBe(true);
    expect(listRes.data?.tools[0].name).toBe('channel_publish');

    const badClient = new McpHttpClient(`http://127.0.0.1:${mcpPort}/mcp`, 'cn_wrong_key');
    const badRes = await badClient.pingAndListTools();
    expect(badRes.ok).toBe(false);
    expect(badRes.httpStatus).toBe(401);
    expect(badRes.isAuthMismatch).toBe(true);
  });
});

describe('Real SQLite Persistence Across Restarts', () => {
  it('persists leads, posts, and settings to a real SQLite file on disk', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-sqlite-'));
    const dbFile = path.join(tmpDir, 'workspace.sqlite');

    const store1 = new SqliteWorkspaceStore(dbFile);
    const created = store1.addLead({
      platform: 'xiaohongshu',
      sourcePostId: 'xhs-88',
      shortLinkId: 'sl-xhs-88',
      nickname: 'RealBuyer',
      sanitizedComment: '请问私有化怎么报价？',
      intentTier: 'S',
      intentScore: 96,
    });
    store1.updateLeadStage(created.id, 'won', 19800);
    store1.setSetting('activeRegion', 'cn-official');
    store1.close();

    // Reopen fresh instance from disk to prove durability
    const store2 = new SqliteWorkspaceStore(dbFile);
    const leads = store2.listLeads('won');
    expect(leads).toHaveLength(1);
    expect(leads[0].dealValue).toBe(19800);
    expect(store2.getSetting('activeRegion')).toBe('cn-official');
    store2.close();

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('Real Workbench HTTP API Server E2E', () => {
  const api = createWorkbenchApiServer({ port: 0, dbPath: ':memory:' });
  let baseUrl = '';

  beforeAll(async () => {
    const port = await api.start();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await api.close();
  });

  it('serves healthz, packs, persistent leads CRUD, CSV export, posts, and PII-safe scoring', async () => {
    const health = await fetch(`${baseUrl}/api/healthz`).then((r) => r.json());
    expect(health.ok).toBe(true);
    expect(health.packsLoaded).toBeGreaterThanOrEqual(2);

    const postRes = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Launch Video', platformId: 'tiktok', scheduledAt: '2026-11-26T09:00:00Z' }),
    }).then((r) => r.json());
    expect(postRes.post.title).toBe('Launch Video');

    const leadRes = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'tiktok',
        sourcePostId: 'tt-1',
        nickname: 'BuyerUS',
        sanitizedComment: 'How much is enterprise?',
        intentTier: 'S',
        intentScore: 95,
      }),
    }).then((r) => r.json());
    expect(leadRes.lead.stage).toBe('new');

    await fetch(`${baseUrl}/api/leads/${leadRes.lead.id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'won', dealValue: 4900 }),
    });

    const csv = await fetch(`${baseUrl}/api/leads/export.csv`).then((r) => r.text());
    expect(csv).toContain('BuyerUS');
    expect(csv).toContain('4900');

    const scored = await fetch(`${baseUrl}/api/browser/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comments: [{ commentId: '1', nickname: 'User', content: '怎么收费？加微信 wx_123456', likeCount: 2 }],
      }),
    }).then((r) => r.json());
    expect(scored.scored[0].tier).toBe('S');
    expect(scored.scored[0].comment.content).not.toContain('wx_123456');
  });
});
