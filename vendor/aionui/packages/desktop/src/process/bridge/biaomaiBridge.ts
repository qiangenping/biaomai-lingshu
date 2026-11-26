/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserWindow, dialog, ipcMain, session } from 'electron';
import dns from 'node:dns/promises';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import tls from 'node:tls';

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

  // 11. Global B2B Prospect Extractor from Isolated Browser (Google Maps / LinkedIn / Directories)
  ipcMain.handle('biaomai:extract-global-prospects', async (_evt, payload: { partition: string }) => {
    const win = isolatedWindows.get(payload.partition);
    if (!win || win.isDestroyed()) {
      return { ok: false, error: '请先打开隔离浏览器并浏览到 Google Maps / LinkedIn / B2B 黄页搜索结果页', prospects: [] };
    }
    try {
      const result = (await win.webContents.executeJavaScript(`
        (() => {
          const url = location.href;
          const out = [];
          const seen = new Set();
          const emailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/;
          const phoneRe = /\\+?\\d[\\d\\s\\-().]{6,18}\\d/;

          // 1) Google Maps cards or generic directory cards
          const cards = Array.from(document.querySelectorAll('[role="article"], li.reusable-search__result-container, .entity-result__item, article, .result, .company-card'));
          for (let i = 0; i < cards.length && out.length < 25; i++) {
            const card = cards[i];
            const text = (card.innerText || '').trim();
            if (text.length < 6) continue;
            const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
            const name = (card.querySelector('h1,h2,h3,h4,.fontHeadlineSmall,a[aria-label]')?.textContent || card.getAttribute('aria-label') || lines[0] || '').trim();
            if (!name || name.length > 100 || seen.has(name.toLowerCase())) continue;
            seen.add(name.toLowerCase());
            const links = Array.from(card.querySelectorAll('a[href]')).map(a => a.href).filter(h => /^https?:\\/\\//i.test(h) && !h.includes('google.com/maps') && !h.includes('linkedin.com/search'));
            const emailMatch = text.match(emailRe);
            const phoneMatch = text.match(phoneRe);
            out.push({
              id: 'b2b_' + i + '_' + Date.now(),
              companyName: name,
              website: links[0] || '',
              email: emailMatch ? emailMatch[0] : '',
              phone: phoneMatch ? phoneMatch[0].trim() : '',
              snippet: lines.slice(0, 3).join(' · ').slice(0, 180),
              sourceUrl: url,
            });
          }

          // 2) Fallback: extract external business links if no structured cards matched
          if (out.length === 0) {
            const anchors = Array.from(document.querySelectorAll('a[href^="http"]'));
            for (let i = 0; i < anchors.length && out.length < 20; i++) {
              const a = anchors[i];
              const title = (a.innerText || '').trim();
              if (!title || title.length < 3 || title.length > 80 || seen.has(title.toLowerCase())) continue;
              if (/google\\.|bing\\.|baidu\\.|gstatic\\.|doubleclick\\./i.test(a.hostname)) continue;
              seen.add(title.toLowerCase());
              out.push({
                id: 'lnk_' + i + '_' + Date.now(),
                companyName: title,
                website: a.href,
                email: '',
                phone: '',
                snippet: a.hostname,
                sourceUrl: url,
              });
            }
          }
          return { url, prospects: out };
        })();
      `)) as { url: string; prospects: Array<{ id: string; companyName: string; website: string; email: string; phone: string; snippet: string; sourceUrl: string }> };
      return { ok: true, url: result.url, prospects: result.prospects || [] };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err), prospects: [] };
    }
  });

  // 12. Company Website Public Contact Enrichment + DNS MX Verification
  ipcMain.handle('biaomai:enrich-company-domain', async (_evt, payload: { website?: string; email?: string }) => {
    let foundEmail = (payload.email || '').trim();
    let foundPhone = '';
    let whatsappUrl = '';
    let linkedinUrl = '';

    const rawSite = (payload.website || '').trim();
    if (rawSite) {
      const normalized = /^https?:\/\//i.test(rawSite) ? rawSite : `https://${rawSite}`;
      const base = normalized.replace(/\/+$/, '');
      const candidateUrls = [normalized, `${base}/contact`, `${base}/contact-us`, `${base}/about`];
      const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
      const phoneRegex = /\+\d[\d\s\-().]{7,18}\d/g;

      for (const targetUrl of candidateUrls) {
        if (foundEmail && foundPhone && whatsappUrl) break;
        try {
          const res = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BiaoMaiLingshu/1.0)' },
            signal: AbortSignal.timeout(7000),
          });
          if (!res.ok) continue;
          const html = await res.text();
          if (!foundEmail) {
            const matches = html.match(emailRegex) || [];
            const valid = matches.find(
              (m) => !/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(m) && !/(example\.com|sentry\.io|wixpress\.com|w3\.org)/i.test(m)
            );
            if (valid) foundEmail = valid;
          }
          if (!foundPhone) {
            const phones = html.match(phoneRegex) || [];
            if (phones[0]) foundPhone = phones[0].trim();
          }
          if (!whatsappUrl) {
            const wa = html.match(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s"'<>]+/i);
            if (wa) whatsappUrl = wa[0];
          }
          if (!linkedinUrl) {
            const li = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[^\s"'<>]+/i);
            if (li) linkedinUrl = li[0];
          }
        } catch {
          // continue to next candidate URL
        }
      }
    }

    let mxValid = false;
    let mxHost = '';
    const emailDomain = foundEmail.includes('@') ? foundEmail.split('@')[1].trim() : '';
    if (emailDomain) {
      try {
        const records = await dns.resolveMx(emailDomain);
        if (records && records.length > 0) {
          mxValid = true;
          mxHost = records.sort((a, b) => a.priority - b.priority)[0].exchange;
        }
      } catch {
        mxValid = false;
      }
    }

    return { ok: true, email: foundEmail, phone: foundPhone, whatsappUrl, linkedinUrl, mxValid, mxHost };
  });

  // 13. Zero-Dependency TLS/STARTTLS SMTP Mailer (Apache-2.0 clean, Human-in-the-Loop gated)
  ipcMain.handle(
    'biaomai:send-smtp-email',
    async (
      _evt,
      payload: {
        host: string;
        port: number;
        secure?: boolean;
        user: string;
        pass: string;
        from?: string;
        to: string;
        subject: string;
        text: string;
      }
    ) => {
      const { host, port, user, pass, to, subject, text } = payload;
      const fromAddr = payload.from || user;
      if (!host || !user || !pass || !to) {
        return { ok: false, error: '请先完整填写 SMTP 服务器、发件账号、授权码及收件邮箱' };
      }

      const sendViaSmtp = (): Promise<{ ok: boolean; error?: string }> =>
        new Promise((resolve) => {
          const useImplicitTls = payload.secure ?? port === 465;
          let socket: net.Socket | tls.TLSSocket = useImplicitTls
            ? tls.connect({ host, port, servername: host, rejectUnauthorized: true })
            : net.createConnection({ host, port });

          let buffer = '';
          let step = 0;
          let finished = false;
          const done = (res: { ok: boolean; error?: string }) => {
            if (finished) return;
            finished = true;
            try {
              socket.end();
            } catch {
              // ignore
            }
            resolve(res);
          };

          socket.setTimeout(15000, () => done({ ok: false, error: 'SMTP 连接超时 (15s)' }));
          socket.on('error', (err) => done({ ok: false, error: err.message }));

          const sendLine = (line: string) => socket.write(`${line}\r\n`);

          const handleResponse = (code: number, fullLine: string) => {
            if (code >= 400) {
              done({ ok: false, error: `SMTP ${code}: ${fullLine.trim()}` });
              return;
            }
            if (step === 0 && code === 220) {
              step = 1;
              sendLine('EHLO biaomai.local');
            } else if (step === 1 && code === 250) {
              if (!useImplicitTls && fullLine.includes('STARTTLS')) {
                step = 2;
                sendLine('STARTTLS');
              } else {
                step = 3;
                sendLine('AUTH LOGIN');
              }
            } else if (step === 2 && code === 220) {
              const upgraded = tls.connect({ socket, servername: host, rejectUnauthorized: true }, () => {
                step = 1;
                sendLine('EHLO biaomai.local');
              });
              upgraded.on('data', onData);
              upgraded.on('error', (err) => done({ ok: false, error: err.message }));
              socket = upgraded;
            } else if (step === 3 && code === 334) {
              step = 4;
              sendLine(Buffer.from(user).toString('base64'));
            } else if (step === 4 && code === 334) {
              step = 5;
              sendLine(Buffer.from(pass).toString('base64'));
            } else if (step === 5 && code === 235) {
              step = 6;
              sendLine(`MAIL FROM:<${fromAddr}>`);
            } else if (step === 6 && code === 250) {
              step = 7;
              sendLine(`RCPT TO:<${to}>`);
            } else if (step === 7 && code === 250) {
              step = 8;
              sendLine('DATA');
            } else if (step === 8 && code === 354) {
              step = 9;
              const encodedSubj = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
              const mime = [
                `From: <${fromAddr}>`,
                `To: <${to}>`,
                `Subject: ${encodedSubj}`,
                'MIME-Version: 1.0',
                'Content-Type: text/plain; charset=UTF-8',
                '',
                text.replace(/^\./gm, '..'),
                '.',
              ].join('\r\n');
              sendLine(mime);
            } else if (step === 9 && code === 250) {
              step = 10;
              sendLine('QUIT');
              done({ ok: true });
            }
          };

          const onData = (chunk: Buffer) => {
            buffer += chunk.toString('utf8');
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? '';
            const lastComplete = lines.filter(Boolean).pop();
            if (!lastComplete) return;
            const match = lastComplete.match(/^(\d{3})([ -])(.*)$/);
            if (match && match[2] === ' ') {
              handleResponse(Number(match[1]), lines.join('\n'));
            }
          };

          socket.on('data', onData);
        });

      return await sendViaSmtp();
    }
  );
}
