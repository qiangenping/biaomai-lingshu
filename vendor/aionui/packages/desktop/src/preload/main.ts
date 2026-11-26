/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// Hook Sentry IPC so the renderer SDK uses ipcRenderer.send instead of falling
// back to fetch('sentry-ipc://...'), which floods the DevTools Network panel.
// Bundled into this preload via `externalizeDepsPlugin({ exclude: [...] })` so
// Electron's sandbox-mode preload doesn't try to resolve it from node_modules.
import '@sentry/electron/preload';
import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { ADAPTER_BRIDGE_EVENT_KEY } from '../common/adapter/constant';

/**
 * @description 注入到renderer进程中, 用于与main进程通信
 * */
contextBridge.exposeInMainWorld('electronAPI', {
  emit: (name: string, data: unknown) => {
    return ipcRenderer
      .invoke(
        ADAPTER_BRIDGE_EVENT_KEY,
        JSON.stringify({
          name: name,
          data: data,
        })
      )
      .catch((error) => {
        console.error('IPC invoke error:', error);
        throw error;
      });
  },
  on: (callback: (payload: { event: unknown; value: unknown }) => void) => {
    const handler = (event: unknown, value: unknown) => {
      callback({ event, value });
    };
    ipcRenderer.on(ADAPTER_BRIDGE_EVENT_KEY, handler);
    return () => {
      ipcRenderer.off(ADAPTER_BRIDGE_EVENT_KEY, handler);
    };
  },
  // 获取拖拽文件/目录的绝对路径 / Get absolute path for dragged file/directory
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  // Feedback: collect and compress recent log files
  collectFeedbackLogs: () => ipcRenderer.invoke('feedback:collect-logs'),
  // Feedback: capture a screenshot of the current window
  captureFeedbackScreenshot: () => ipcRenderer.invoke('feedback:capture-screenshot'),
  // Feedback: forward diagnostics logs to the main process console
  logFeedbackEvent: (payload: { details?: unknown; level: 'info' | 'warn' | 'error'; message: string }) =>
    ipcRenderer.send('feedback:renderer-log', payload),
  recoverCorruptedDatabase: () => ipcRenderer.invoke('backend:recover-corrupted-database'),
});

contextBridge.exposeInMainWorld('biaomaiAPI', {
  openIsolatedBrowser: (payload: { partition: string; url: string; title?: string }) =>
    ipcRenderer.invoke('biaomai:open-isolated-browser', payload),
  extractBrowserComments: (payload: { partition: string }) =>
    ipcRenderer.invoke('biaomai:extract-browser-comments', payload),
  extractBrowserPageFormula: (payload: { partition: string }) =>
    ipcRenderer.invoke('biaomai:extract-browser-page-formula', payload),
  prefillBrowserReply: (payload: { partition: string; replyText: string }) =>
    ipcRenderer.invoke('biaomai:prefill-browser-reply', payload),
  runLlm: (payload: { baseUrl: string; apiKey: string; model: string; systemPrompt: string; userPrompt: string }) =>
    ipcRenderer.invoke('biaomai:run-llm', payload),
  generateImage: (payload: { baseUrl: string; apiKey: string; model: string; prompt: string; size?: string }) =>
    ipcRenderer.invoke('biaomai:generate-image', payload),
  callAiToEarnMcp: (payload: { endpoint: string; apiKey: string; method: string; params?: Record<string, unknown> }) =>
    ipcRenderer.invoke('biaomai:call-aitoearn-mcp', payload),
  listInstalledPacks: () => ipcRenderer.invoke('biaomai:list-installed-packs'),
  installLocalPack: () => ipcRenderer.invoke('biaomai:install-local-pack'),
  uninstallPack: (payload: { packName: string }) => ipcRenderer.invoke('biaomai:uninstall-pack', payload),
  extractGlobalProspects: (payload: { partition: string }) => ipcRenderer.invoke('biaomai:extract-global-prospects', payload),
  enrichCompanyDomain: (payload: { website?: string; email?: string }) =>
    ipcRenderer.invoke('biaomai:enrich-company-domain', payload),
  sendSmtpEmail: (payload: {
    host: string;
    port: number;
    secure?: boolean;
    user: string;
    pass: string;
    from?: string;
    to: string;
    subject: string;
    text: string;
  }) => ipcRenderer.invoke('biaomai:send-smtp-email', payload),
});

// Synchronously fetch the aioncore port and expose it to the renderer
// via contextBridge (direct window assignment is invisible under contextIsolation).
const backendPort = ipcRenderer.sendSync('get-backend-port') as number;
const initialLanguage = ipcRenderer.sendSync('get-initial-language') as string | null;
const backendStartupFailed = ipcRenderer.sendSync('get-backend-startup-failed') as boolean;
const backendStartupFailure = ipcRenderer.sendSync('get-backend-startup-failure') as unknown;
contextBridge.exposeInMainWorld('__backendPort', backendPort > 0 ? backendPort : 0);
contextBridge.exposeInMainWorld('__initialLanguage', initialLanguage ?? null);
contextBridge.exposeInMainWorld('__aionuiE2ETest', process.env.AIONUI_E2E_TEST === '1');
contextBridge.exposeInMainWorld('__backendStartupFailed', backendStartupFailed === true);
contextBridge.exposeInMainWorld('__backendStartupFailure', backendStartupFailure ?? null);

// Backend startup state bridge: `getState` re-reads the current failure info on
// mount (resolves the "READY arrived before the renderer subscribed" race), and
// `subscribe` receives subsequent ready/exit pushes on the backend-startup-state
// channel. All communication stays behind the preload contextBridge.
contextBridge.exposeInMainWorld('__backendStartupBridge', {
  getState: () => ipcRenderer.sendSync('get-backend-startup-failure'),
  subscribe: (callback: (state: unknown) => void) => {
    const handler = (_event: unknown, value: unknown) => callback(value);
    ipcRenderer.on('backend-startup-state', handler);
    return () => {
      ipcRenderer.off('backend-startup-state', handler);
    };
  },
});

// 托盘事件监听 - 将 IPC 事件转换为 DOM 事件
// Tray event listeners - convert IPC events to DOM events
const trayEvents = [
  'tray:navigate-to-guid',
  'tray:navigate-to-conversation',
  'tray:open-about',
  'tray:pause-all-tasks',
  'tray:check-update',
];

for (const channel of trayEvents) {
  ipcRenderer.on(channel, (_event, ...args) => {
    window.dispatchEvent(new CustomEvent(channel, { detail: args[0] }));
  });
}
