const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('biaomaiElectron', {
  isElectron: true,
  mountBrowser: (payload) => ipcRenderer.invoke('browser:mount', payload),
  hideBrowser: () => ipcRenderer.invoke('browser:hide'),
  analyzeVisibleComments: () => ipcRenderer.invoke('browser:analyze-visible-comments'),
  prefillReply: (replyText) => ipcRenderer.invoke('browser:prefill-reply', { replyText }),
  encryptSecret: (plain) => ipcRenderer.invoke('vault:encrypt', plain),
});
