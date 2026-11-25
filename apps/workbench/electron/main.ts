import { app, BrowserWindow, ipcMain, safeStorage, session, WebContentsView } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreExtractedComments, type RawCommentItem } from '@biaomai/ai-browser';
import { createWorkbenchApiServer } from '../server/api-server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindow | null = null;
let embeddedView: WebContentsView | null = null;
let currentPartition = '';
let apiServerHandle: ReturnType<typeof createWorkbenchApiServer> | null = null;

// Expose local CDP for vercel-labs/agent-browser & browserbase/stagehand
app.commandLine.appendSwitch('remote-debugging-port', '19220');

function ensureEmbeddedView(partition: string): WebContentsView {
  if (!mainWindow) throw new Error('Main window not initialized');
  if (embeddedView && currentPartition === partition) {
    return embeddedView;
  }

  if (embeddedView) {
    mainWindow.contentView.removeChildView(embeddedView);
    embeddedView.webContents.close();
    embeddedView = null;
  }

  const isolatedSession = session.fromPartition(partition);
  embeddedView = new WebContentsView({
    webPreferences: {
      session: isolatedSession,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  currentPartition = partition;
  mainWindow.contentView.addChildView(embeddedView);
  return embeddedView;
}

async function createWindow() {
  apiServerHandle = createWorkbenchApiServer({ port: 19830 });
  await apiServerHandle.start();

  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1280,
    minHeight: 760,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.BIAOMAI_DEV_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

ipcMain.handle(
  'browser:mount',
  async (_evt, payload: { partition: string; url: string; bounds: { x: number; y: number; width: number; height: number } }) => {
    const view = ensureEmbeddedView(payload.partition);
    view.setBounds({
      x: Math.round(payload.bounds.x),
      y: Math.round(payload.bounds.y),
      width: Math.max(200, Math.round(payload.bounds.width)),
      height: Math.max(200, Math.round(payload.bounds.height)),
    });
    if (payload.url && view.webContents.getURL() !== payload.url) {
      await view.webContents.loadURL(payload.url);
    }
    return { ok: true, url: view.webContents.getURL(), cdpPort: 19220 };
  },
);

ipcMain.handle('browser:hide', async () => {
  if (embeddedView && mainWindow) {
    embeddedView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
  }
  return { ok: true };
});

ipcMain.handle('browser:analyze-visible-comments', async () => {
  if (!embeddedView) {
    return { ok: false, error: 'Embedded browser is not mounted', scored: [] };
  }

  // Visible DOM extraction only (zero hidden scraping), followed by mandatory pii-sanitizer
  const rawComments = (await embeddedView.webContents.executeJavaScript(`
    (() => {
      const candidates = Array.from(document.querySelectorAll('[class*="comment"], [data-e2e*="comment"], article p, li p'));
      const seen = new Set();
      const results = [];
      for (let i = 0; i < candidates.length && results.length < 30; i++) {
        const el = candidates[i];
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const text = (el.innerText || '').trim();
        if (text.length < 4 || text.length > 300 || seen.has(text)) continue;
        seen.add(text);
        results.push({
          commentId: 'dom_' + i,
          nickname: 'VisibleUser_' + (results.length + 1),
          content: text,
          likeCount: 0
        });
      }
      return results;
    })();
  `)) as RawCommentItem[];

  const scored = scoreExtractedComments(rawComments);
  return { ok: true, url: embeddedView.webContents.getURL(), scored };
});

ipcMain.handle('browser:prefill-reply', async (_evt, payload: { replyText: string }) => {
  if (!embeddedView) {
    return { ok: false, error: 'Embedded browser is not mounted' };
  }
  const safeText = JSON.stringify(payload.replyText);
  // Compliance invariant: fill input and highlight, NEVER click Send automatically
  const filled = await embeddedView.webContents.executeJavaScript(`
    (() => {
      const target = document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT' || document.activeElement.isContentEditable)
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
      setTimeout(() => { target.style.outline = ''; }, 1500);
      return true;
    })();
  `);
  return { ok: Boolean(filled), stopBeforeSubmit: true };
});

ipcMain.handle('vault:encrypt', (_evt, plain: string) => {
  if (!safeStorage.isEncryptionAvailable()) return plain;
  return safeStorage.encryptString(plain).toString('base64');
});

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  if (apiServerHandle) await apiServerHandle.close();
  if (process.platform !== 'darwin') app.quit();
});
