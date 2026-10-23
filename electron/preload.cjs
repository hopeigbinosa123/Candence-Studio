const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cadenceNative', {
  saveProjectDialog: (defaultName) => ipcRenderer.invoke('dialog:saveProject', defaultName),
  openProjectDialog: () => ipcRenderer.invoke('dialog:openProject'),
  exportAudioDialog: (defaultName) => ipcRenderer.invoke('dialog:exportAudio', defaultName),
  writeBinaryFile: (filePath, buffer) => ipcRenderer.invoke('file:writeBinary', { filePath, buffer }),
  platform: process.platform,
});
