import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CanvasRegistry, type Locale, type RegionId } from '@biaomai/plugin-sdk';
import {
  McpHttpClient,
  PackLoader,
  PermissionGuard,
  RegionRouter,
  runChatCompletion,
} from '@biaomai/plugin-runtime';
import { scoreExtractedComments, type RawCommentItem } from '@biaomai/ai-browser';
import { SqliteWorkspaceStore } from '../../../packs/pack-leadgen-ops/core/sqlite-crm-store.js';
import { computeChannelRoi } from '../../../packs/pack-leadgen-ops/core/attribution-service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../../..');

export interface ApiServerOptions {
  port?: number;
  dbPath?: string;
}

function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
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

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

export function createWorkbenchApiServer(options: ApiServerOptions = {}) {
  const dbPath = options.dbPath ?? path.join(REPO_ROOT, '.biaomai-data', 'workspace.sqlite');
  const store = new SqliteWorkspaceStore(dbPath);
  const canvasRegistry = new CanvasRegistry();
  const packLoader = new PackLoader(canvasRegistry);
  const permissionGuard = new PermissionGuard();
  const regionRouter = new RegionRouter();

  regionRouter.loadProfilesFromDir(path.join(REPO_ROOT, 'config'));

  const loadAllPacks = () => {
    const packsDir = path.join(REPO_ROOT, 'packs');
    if (!fs.existsSync(packsDir)) return;
    for (const entry of fs.readdirSync(packsDir, { withFileTypes: true })) {
      if (entry.isDirectory() && fs.existsSync(path.join(packsDir, entry.name, 'aion-extension.json'))) {
        packLoader.loadFromDirectory(path.join(packsDir, entry.name));
      }
    }
  };
  loadAllPacks();

  // Restore saved region & keys from SQLite
  const savedRegion = store.getSetting('activeRegion') as RegionId | undefined;
  if (savedRegion) {
    try {
      regionRouter.setRegion(savedRegion, false);
    } catch {
      // ignore invalid saved region
    }
  }
  for (const r of ['cn-official', 'global-official', 'self-hosted'] as const) {
    const k = store.getSetting(`apiKey:${r}`);
    if (k) regionRouter.setApiKey(r, k);
  }

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const pathname = url.pathname;

    try {
      // Health check
      if (req.method === 'GET' && pathname === '/api/healthz') {
        return sendJson(res, 200, {
          ok: true,
          region: regionRouter.getActiveProfile().id,
          packsLoaded: packLoader.listLoaded().length,
          leadsCount: store.listLeads().length,
        });
      }

      // Settings & Region
      if (req.method === 'GET' && pathname === '/api/settings') {
        const profile = regionRouter.getActiveProfile();
        return sendJson(res, 200, {
          activeRegion: profile.id,
          profile,
          hasApiKeys: {
            'cn-official': Boolean(regionRouter.getApiKey('cn-official')),
            'global-official': Boolean(regionRouter.getApiKey('global-official')),
            'self-hosted': Boolean(regionRouter.getApiKey('self-hosted')),
          },
          llm: {
            baseUrl: store.getSetting('llm:baseUrl') || 'https://api.deepseek.com/v1',
            model: store.getSetting('llm:model') || 'deepseek-chat',
            hasApiKey: Boolean(store.getSetting('llm:apiKey')),
          },
        });
      }

      if (req.method === 'POST' && pathname === '/api/settings') {
        const body = await readJsonBody(req);
        if (typeof body.activeRegion === 'string') {
          regionRouter.setRegion(body.activeRegion as RegionId, false);
          store.setSetting('activeRegion', body.activeRegion);
        }
        if (typeof body.regionApiKey === 'string' && typeof body.regionForKey === 'string') {
          const r = body.regionForKey as RegionId;
          regionRouter.setApiKey(r, body.regionApiKey);
          store.setSetting(`apiKey:${r}`, body.regionApiKey);
        }
        if (typeof body.llmBaseUrl === 'string') store.setSetting('llm:baseUrl', body.llmBaseUrl.trim());
        if (typeof body.llmModel === 'string') store.setSetting('llm:model', body.llmModel.trim());
        if (typeof body.llmApiKey === 'string' && body.llmApiKey.trim()) {
          store.setSetting('llm:apiKey', body.llmApiKey.trim());
        }
        return sendJson(res, 200, { ok: true, activeRegion: regionRouter.getActiveProfile().id });
      }

      // Real MCP Connection Test & Tool Listing
      if (req.method === 'POST' && pathname === '/api/mcp/test') {
        const profile = regionRouter.getActiveProfile();
        const apiKey = regionRouter.getApiKey(profile.id) || '';
        const preCheck = regionRouter.diagnoseAuthMismatch(apiKey);
        const client = McpHttpClient.fromProfile(profile, apiKey);
        const result = await client.pingAndListTools();
        const postCheck =
          !result.ok && result.isAuthMismatch
            ? regionRouter.diagnoseAuthMismatch(apiKey, result.httpStatus)
            : preCheck;

        return sendJson(res, 200, {
          ...result,
          endpoint: profile.mcp.httpEndpoint,
          regionMismatch: postCheck,
        });
      }

      // Real MCP Tool Execution
      if (req.method === 'POST' && pathname === '/api/mcp/call') {
        const body = await readJsonBody(req);
        const toolName = String(body.toolName || '');
        const args = (body.args as Record<string, unknown>) || {};
        const profile = regionRouter.getActiveProfile();
        const apiKey = regionRouter.getApiKey(profile.id) || '';
        const client = McpHttpClient.fromProfile(profile, apiKey);
        const result = await client.callTool(toolName, args);
        return sendJson(res, 200, result);
      }

      // Real LLM Chat with Loaded Expert SKILL.md System Prompt
      if (req.method === 'POST' && pathname === '/api/chat') {
        const body = await readJsonBody(req);
        const prompt = String(body.prompt || '').trim();
        const assistantId = String(body.assistantId || 'growth-leadgen-director');
        const locale = (body.locale === 'en-US' ? 'en-US' : 'zh-CN') as Locale;

        // Load real SKILL.zh.md / SKILL.en.md from active pack
        let systemPrompt = 'You are BiaoMai Lingshu Autonomous Lead-Gen AI.';
        const leadgen = packLoader.get('pack-leadgen-ops');
        const assistant = leadgen?.manifest.contributes.assistants.find((a) => a.id === assistantId);
        if (leadgen && assistant) {
          const skillRel = assistant.localizedContextFiles?.[locale] || assistant.contextFile;
          const skillPath = path.resolve(leadgen.dir, skillRel);
          if (fs.existsSync(skillPath)) {
            systemPrompt = fs.readFileSync(skillPath, 'utf8');
          }
        }

        const llmApiKey = store.getSetting('llm:apiKey') || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || '';
        const llmBaseUrl = store.getSetting('llm:baseUrl') || process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1';
        const llmModel = store.getSetting('llm:model') || process.env.LLM_MODEL || 'deepseek-chat';

        if (!llmApiKey && !llmBaseUrl.includes('localhost') && !llmBaseUrl.includes('127.0.0.1')) {
          return sendJson(res, 200, {
            ok: false,
            needsConfiguration: true,
            latencyMs: 1,
            content:
              locale === 'zh-CN'
                ? '尚未配置大模型 API Key。请点击右上角「⚙️ 设置」，填入 DeepSeek / OpenAI / 本地 Ollama 地址与密钥后即可发起真实 AI 对话与 MCP 工具调用。'
                : 'No LLM API Key configured yet. Click "⚙️ Settings" in the top-right to enter your DeepSeek / OpenAI / local Ollama endpoint and key.',
          });
        }

        const completion = await runChatCompletion(
          { baseUrl: llmBaseUrl, apiKey: llmApiKey, model: llmModel },
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        );
        return sendJson(res, 200, completion);
      }

      // Packs & Plugins Hot Reload
      if (req.method === 'GET' && pathname === '/api/packs') {
        return sendJson(res, 200, {
          packs: packLoader.listLoaded().map((p) => ({
            name: p.manifest.name,
            displayName: p.manifest.displayName,
            version: p.manifest.version,
            category: p.manifest.category,
            enabled: p.enabled,
            permissions: p.manifest.permissions,
            assistantsCount: p.manifest.contributes.assistants.length,
            skillsCount: p.manifest.contributes.skills.length,
            canvasesCount: p.manifest.contributes.canvases.length,
          })),
          auditLogCount: permissionGuard.getAuditLog().length,
        });
      }

      if (req.method === 'POST' && pathname === '/api/packs/reload') {
        loadAllPacks();
        return sendJson(res, 200, { ok: true, count: packLoader.listLoaded().length });
      }

      // SQLite Persisted Leads CRM
      if (req.method === 'GET' && pathname === '/api/leads') {
        const leads = store.listLeads();
        const roi = computeChannelRoi(
          store.listPosts().map((p) => ({
            shortLinkId: p.shortLinkId,
            platform: p.platformId,
            postTitle: p.title,
            clicks: p.status === 'published' ? 120 : 0,
          })),
          leads,
        );
        return sendJson(res, 200, { leads, roi });
      }

      if (req.method === 'GET' && pathname === '/api/leads/export.csv') {
        const csv = store.exportLeadsCsv();
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="biaomai-leads.csv"',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(csv);
        return;
      }

      if (req.method === 'POST' && pathname === '/api/leads') {
        const body = await readJsonBody(req);
        const lead = store.addLead({
          platform: String(body.platform || 'tiktok'),
          sourcePostId: String(body.sourcePostId || 'live-post'),
          shortLinkId: body.shortLinkId ? String(body.shortLinkId) : undefined,
          nickname: String(body.nickname || 'Anonymous'),
          sanitizedComment: String(body.sanitizedComment || ''),
          intentTier: (body.intentTier as 'S' | 'A' | 'B' | 'C') || 'A',
          intentScore: Number(body.intentScore || 75),
        });
        return sendJson(res, 201, { lead });
      }

      if (req.method === 'PATCH' && pathname.startsWith('/api/leads/') && pathname.endsWith('/stage')) {
        const id = pathname.split('/')[3];
        const body = await readJsonBody(req);
        const lead = store.updateLeadStage(
          id,
          body.stage as 'new' | 'engaged' | 'qualified' | 'opportunity' | 'won',
          typeof body.dealValue === 'number' ? body.dealValue : undefined,
        );
        return sendJson(res, 200, { lead });
      }

      // SQLite Persisted Scheduled Posts
      if (req.method === 'GET' && pathname === '/api/posts') {
        return sendJson(res, 200, { posts: store.listPosts() });
      }

      if (req.method === 'POST' && pathname === '/api/posts') {
        const body = await readJsonBody(req);
        const post = store.addPost({
          title: String(body.title || 'Untitled'),
          platformId: String(body.platformId || 'tiktok'),
          scheduledAt: String(body.scheduledAt || new Date().toISOString()),
          status: (body.status as 'draft' | 'scheduled') || 'scheduled',
          shortLinkId: String(body.shortLinkId || `sl-${Date.now().toString(36)}`),
        });
        return sendJson(res, 201, { post });
      }

      if (req.method === 'PATCH' && pathname.startsWith('/api/posts/') && pathname.endsWith('/status')) {
        const id = pathname.split('/')[3];
        const body = await readJsonBody(req);
        const post = store.updatePostStatus(id, body.status as 'published' | 'scheduled' | 'draft');
        return sendJson(res, 200, { post });
      }

      // Browser Comment Scoring + PII Sanitization
      if (req.method === 'POST' && pathname === '/api/browser/score') {
        const body = await readJsonBody(req);
        const rawComments = Array.isArray(body.comments) ? (body.comments as RawCommentItem[]) : [];
        const scored = scoreExtractedComments(rawComments);
        return sendJson(res, 200, { scored });
      }

      return sendJson(res, 404, { error: `Not found: ${pathname}` });
    } catch (err) {
      return sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
  });

  const port = options.port ?? Number(process.env.BIAOMAI_API_PORT || 19830);
  return {
    server,
    store,
    start: () =>
      new Promise<number>((resolve) => {
        server.listen(port, '127.0.0.1', () => {
          const addr = server.address();
          resolve(typeof addr === 'object' && addr ? addr.port : port);
        });
      }),
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => {
          store.close();
          resolve();
        });
      }),
  };
}

// Run standalone when executed directly via `tsx apps/workbench/server/api-server.ts`
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const api = createWorkbenchApiServer();
  api.start().then((boundPort) => {
    console.log(`✅ BiaoMai Workbench API Server listening on http://127.0.0.1:${boundPort}`);
  });
}
