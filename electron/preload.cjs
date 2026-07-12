const { contextBridge, ipcRenderer } = require('electron');

/**
 * Minimal desktop bridge. One capability only: the page can hand the main
 * process a license code so the updater (which runs in main) knows whether
 * this install is the full version. Nothing is exposed in the other
 * direction and no other IPC exists.
 */
contextBridge.exposeInMainWorld('keyBuddyDesktop', {
  setLicense: (code) => {
    if (typeof code === 'string' && code.length <= 24) {
      ipcRenderer.invoke('kb:set-license', code);
    }
  },
});
