const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Cadence Studio DAW',
    backgroundColor: '#121316',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  const devUrl = 'http://localhost:5173';
  const prodPath = path.join(__dirname, '../dist/index.html');

  if (process.env.NODE_ENV === 'development' || !fs.existsSync(prodPath)) {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(prodPath);
    });
  } else {
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Native DAW Operations
ipcMain.handle('dialog:saveProject', async (event, defaultName) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Cadence Project',
    defaultPath: defaultName || 'Untitled.cadence',
    filters: [{ name: 'Cadence DAW Project (*.cadence)', extensions: ['cadence', 'json'] }],
  });
  return { canceled, filePath };
});

ipcMain.handle('dialog:openProject', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Cadence Project',
    properties: ['openFile'],
    filters: [{ name: 'Cadence DAW Project (*.cadence, *.json)', extensions: ['cadence', 'json'] }],
  });
  if (canceled || filePaths.length === 0) return { canceled: true };
  const content = fs.readFileSync(filePaths[0], 'utf-8');
  return { canceled: false, filePath: filePaths[0], content };
});

ipcMain.handle('dialog:exportAudio', async (event, defaultName) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Rendered Master WAV',
    defaultPath: defaultName || 'Master_Export.wav',
    filters: [{ name: 'Wave Audio File (*.wav)', extensions: ['wav'] }],
  });
  return { canceled, filePath };
});

ipcMain.handle('file:writeBinary', async (event, { filePath, buffer }) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
