/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserWindow, dialog, ipcMain, session } from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const isolatedWindows = new Map<string, BrowserWindow>();

function sanitizePiiText(input: string): { text: string; redacted: number } {
  let redacted = 0;
  let text = input;
  const patterns = [
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    /(?<!\d)1[3-9]\d{9}(?!\d)/g,
    /(?:微信|vx|v信|wx|wechat)[\s:：号]*[a-zA-Z0-9_-]{5,20}/gi,
    /https?:\/\/[^\s]+/gi,
  ];
  for (const pattern of patterns) {
    text = text.replace(pattern, () => {
      redacted += 1;
      return '[REDACTED]';
    });
  }
  return { text: text.trim(), redacted };
}

function getExtensionsDir(): string {
  const dir = path.join(os.homedir(), '.aionui-dev', 'extensions');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const FORBIDDEN_LICENSES = [/\bAGPL/i, /\bGPL/i, /\bLGPL/i, /\bSSPL/i, /\bFSL\b/i, /Community Source/i];

export function initBiaoMaiBridge(): void {
  // 1. Real Electron Multi-Account Isolated Browser Window (persist:bm-acc-*)
  ipcMain.handle(
    'biaomai:open-isolated-browser',
    async (_evt, payload: { partition: string; url: string; title?: string }) => {
      const { partition, url, title } = payload;
      const existing = isolatedWindows.get(partition);
      if (existing && !existing.isDestroyed()) {
        existing.show();
        existing.focus();
        if (url && existing.webContents.getURL() !== url) {
          await existing.webContents.loadURL(url);
        }
        return { ok: true, partition, url: existing.webContents.getURL() };
      }

      const isoSession = session.fromPartition(partition);
      const win = new BrowserWindow({
        width: 1180,
        height: 820,
        title: title || `标脉隔离浏览器 · ${partition}`,
        webPreferences: {
          session: isoSession,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });
      win.on('closed', () => {
        isolatedWindows.delete(partition);
      });
      isolatedWindows.set(partition, win);
      await win.loadURL(url);
      return { ok: true, partition, url: win.webContents.getURL() };
    }
  );

  // 2. Real Live Visible-DOM Comment Extractor (Zero Hidden Scraping + Mandatory PII Sanitizer)
  ipcMain.handle('biaomai:extract-browser-comments', async (_evt, payload: { partition: string }) => {
    const win = isolatedWindows.get(payload.partition);
    if (!win || win.isDestroyed()) {
      return { ok: false, error: '请先打开该账号的隔离浏览器窗口并浏览到目标帖子评论区', comments: [] };
    }

    try {
      const rawList = (await win.webContents.executeJavaScript(`
        (() => {
          const selectors = '[class*="comment"], [data-e2e*="comment"], [class*="reply"], article p, li p';
          const nodes = Array.from(document.querySelectorAll(selectors));
          const seen = new Set();
          const out = [];
          for (let i = 0; i < nodes.length && out.length < 30; i++) {
            const el = nodes[i];
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const text = (el.innerText || '').trim();
            if (text.length < 4 || text.length > 260 || seen.has(text)) continue;
            seen.add(text);
            out.push({ id: 'dom_' + i, text });
          }
          return out;
        })();
      `)) as Array<{ id: string; text: string }>;

      const sanitized = rawList.map((item) => {
        const clean = sanitizePiiText(item.text);
        return { id: item.id, text: clean.text, redacted: clean.redacted };
      });
      return { ok: true, url: win.webContents.getURL(), comments: sanitized };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err), comments: [] };
    }
  });

  // 3. Semantic Competitor Post Extractor from Visible Browser Tab (Stagehand-style structured DOM summary)
  ipcMain.handle('biaomai:extract-browser-page-formula', async (_evt, payload: { partition: string }) => {
    const win = isolatedWindows.get(payload.partition);
    if (!win || win.isDestroyed()) {
      return { ok: false, error: '请先打开该账号的隔离浏览器窗口并浏览到竞品爆款页面' };
    }
    try {
      const summary = (await win.webContents.executeJavaScript(`
        (() => {
          const title = document.title || '';
          const h1 = (document.querySelector('h1, [class*="title"]')?.innerText || '').trim();
          const paragraphs = Array.from(document.querySelectorAll('article, main, [class*="desc"], [class*="content"], p'))
            .map((el) => (el.innerText || '').trim())
            .filter((t) => t.length >= 15 && t.length <= 600)
            .slice(0, 6);
          return {
            url: location.href,
            title: h1 || title,
            excerpt: paragraphs.join('\\n')
          };
        })();
      `)) as { url: string; title: string; excerpt: string };
      return { ok: true, ...summary };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // 4. Compliant Human-in-the-Loop Reply Prefill (ALWAYS stops before clicking Send)
  ipcMain.handle('biaomai:prefill-browser-reply', async (_evt, payload: { partition: string; replyText: string }) => {
    const win = isolatedWindows.get(payload.partition);
    if (!win || win.isDestroyed()) {
      return { ok: false, error: '隔离浏览器窗口未打开' };
    }
    const safeText = JSON.stringify(payload.replyText);
    const filled = await win.webContents.executeJavaScript(`
      (() => {
        const target =
          document.activeElement &&
          (document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.tagName === 'INPUT' ||
            document.activeElement.isContentEditable)
            ? document.activeElement
            : document.querySelector('textarea, [contenteditable="true"], input[placeholder*="评论"], input[placeholder*="comment" i], input[placeholder*="reply" i]');
        if (!target) return false;
        target.focus();
        if (target.isContentEditable) {
          target.textContent = ${safeText};
        } else {
          target.value = ${safeText};
        }
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.style.outline = '2px solid #10B981';
        setTimeout(() => { target.style.outline = ''; }, 2000);
        return true;
      })();
    `);
    win.focus();
    return { ok: Boolean(filled), stopBeforeSubmit: true };
  });

  // 5. Real OpenAI-Compatible LLM Call (Main Process — Zero CORS)
  ipcMain.handle(
    'biaomai:run-llm',
    async (
      _evt,
      payload: { baseUrl: string; apiKey: string; model: string; systemPrompt: string; userPrompt: string }
    ) => {
      const started = Date.now();
      const base = (payload.baseUrl || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
      const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (payload.apiKey) headers.Authorization = `Bearer ${payload.apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: payload.model || 'deepseek-chat',
            temperature: 0.7,
            messages: [
              { role: 'system', content: payload.systemPrompt },
              { role: 'user', content: payload.userPrompt },
            ],
          }),
        });
        const latencyMs = Date.now() - started;
        if (!res.ok) {
          const text = await res.text();
          return { ok: false, latencyMs, error: `HTTP ${res.status}: ${text.slice(0, 260)}` };
        }
        const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        return { ok: true, latencyMs, content: json.choices?.[0]?.message?.content?.trim() || '' };
      } catch (err) {
        return { ok: false, latencyMs: Date.now() - started, error: err instanceof Error ? err.message : String(err) };
      }
    }
  );

  // 6. Real AI Image Generation (OpenAI-compatible /images/generations — Zero CORS)
  ipcMain.handle(
    'biaomai:generate-image',
    async (_evt, payload: { baseUrl: string; apiKey: string; model: string; prompt: string; size?: string }) => {
      const base = (payload.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const url = base.endsWith('/images/generations') ? base : `${base}/images/generations`;
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (payload.apiKey) headers.Authorization = `Bearer ${payload.apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: payload.model || 'gpt-image-1',
            prompt: payload.prompt,
            size: payload.size || '1024x1024',
            n: 1,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 260)}` };
        }
        const json = (await res.json()) as { data?: Array<{ url?: string; b64_json?: string }> };
        const first = json.data?.[0];
        const imageUrl = first?.url || (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : '');
        return { ok: Boolean(imageUrl), imageUrl };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    }
  );

  // 7. Real AiToEarn Unified MCP Call (CN / Global / Custom — Zero CORS)
  ipcMain.handle(
    'biaomai:call-aitoearn-mcp',
    async (
      _evt,
      payload: { endpoint: string; apiKey: string; method: string; params?: Record<string, unknown> }
    ) => {
      const started = Date.now();
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        };
        if (payload.apiKey) headers['x-api-key'] = payload.apiKey;
        const res = await fetch(payload.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: payload.method,
            params: payload.params || {},
          }),
        });
        const latencyMs = Date.now() - started;
        const text = await res.text();
        if (res.status === 401 || res.status === 403) {
          return { ok: false, httpStatus: res.status, latencyMs, isAuthMismatch: true, error: `HTTP ${res.status} 区域或 API Key 不匹配` };
        }
        if (!res.ok) {
          return { ok: false, httpStatus: res.status, latencyMs, error: `HTTP ${res.status}: ${text.slice(0, 260)}` };
        }
        const jsonLine = text
          .split('\n')
          .map((l) => l.trim())
          .find((l) => l.startsWith('data:'))
          ?.slice(5)
          .trim();
        const parsed = JSON.parse(jsonLine || text);
        return { ok: !parsed.error, httpStatus: res.status, latencyMs, data: parsed.result, error: parsed.error?.message };
      } catch (err) {
        return { ok: false, httpStatus: 0, latencyMs: Date.now() - started, error: err instanceof Error ? err.message : String(err) };
      }
    }
  );

  // 8. Hot-Pluggable Industry Pack Manager (.bmpack / aion-extension.json)
  ipcMain.handle('biaomai:list-installed-packs', async () => {
    const extDir = getExtensionsDir();
    const list: Array<{
      name: string;
      displayName: unknown;
      description: unknown;
      version: string;
      license: string;
      category: string;
      permissions: Record<string, unknown>;
      assistantsCount: number;
      skillsCount: number;
      canvasesCount: number;
    }> = [];

    for (const entry of fs.readdirSync(extDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(extDir, entry.name, 'aion-extension.json');
      if (!fs.existsSync(manifestPath)) continue;
      try {
        const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        list.push({
          name: m.name || entry.name,
          displayName: m.displayName || m.name || entry.name,
          description: m.description || '',
          version: m.version || '1.0.0',
          license: m.license || 'Apache-2.0',
          category: m.category || 'utility',
          permissions: m.permissions || {},
          assistantsCount: (m.contributes?.assistants || []).length,
          skillsCount: (m.contributes?.skills || []).length,
          canvasesCount: (m.contributes?.canvases || []).length,
        });
      } catch {
        // skip invalid manifest
      }
    }
    return { ok: true, packs: list };
  });

  ipcMain.handle('biaomai:install-local-pack', async () => {
    const picked = await dialog.showOpenDialog({
      title: '选择行业扩展包目录 (包含 aion-extension.json)',
      properties: ['openDirectory'],
    });
    if (picked.canceled || picked.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    const srcDir = picked.filePaths[0];
    const manifestPath = path.join(srcDir, 'aion-extension.json');
    if (!fs.existsSync(manifestPath)) {
      return { ok: false, error: '所选目录缺少 aion-extension.json 清单文件' };
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { name?: string; license?: string };
    const licenseStr = String(manifest.license || 'Apache-2.0');
    if (FORBIDDEN_LICENSES.some((re) => re.test(licenseStr))) {
      return { ok: false, error: `协议合规拦截：不支持受限协议 "${licenseStr}"` };
    }
    const packName = manifest.name || path.basename(srcDir);
    const destDir = path.join(getExtensionsDir(), packName);
    fs.rmSync(destDir, { recursive: true, force: true });
    fs.cpSync(srcDir, destDir, { recursive: true });
    return { ok: true, packName };
  });

  ipcMain.handle('biaomai:uninstall-pack', async (_evt, payload: { packName: string }) => {
    const destDir = path.join(getExtensionsDir(), payload.packName);
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
    }
    return { ok: true };
  });
}
