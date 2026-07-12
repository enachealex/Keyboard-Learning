const { app, BrowserWindow, Menu, ipcMain } = require('electron');

const path = require('path');

const fs = require('fs');

const { scheduleUpdateCheck, LICENSE_FORMAT } = require('./updater.cjs');



// The school installer injects `edition: "school"` into the app's

// package.json via electron-builder extraMetadata; the free app has none.

function readEdition() {

  try {

    return require(path.join(app.getAppPath(), 'package.json')).edition ?? 'web';

  } catch {

    return 'web';

  }

}

const EDITION = readEdition();

const IS_SCHOOL = EDITION === 'school';



const APP_ID = IS_SCHOOL ? 'com.keybuddy.school' : 'com.keybuddy.app';

const APP_NAME = IS_SCHOOL ? 'Key Buddy School' : 'Key Buddy';



// Must run before app.ready so Windows taskbar uses Key Buddy (not "Electron").

app.setName(APP_NAME);

if (process.platform === 'win32') {

  app.setAppUserModelId(APP_ID);

}



const isDev = !app.isPackaged;

let mainWindow = null;



function getWindowIcon() {

  const iconPath = path.join(__dirname, 'icon.png');

  try {

    if (require('fs').existsSync(iconPath)) return iconPath;

  } catch {

    // ignore

  }

  return undefined;

}



function createWindow() {

  mainWindow = new BrowserWindow({

    width: 1280,

    height: 800,

    minWidth: 800,

    minHeight: 600,

    title: APP_NAME,

    icon: getWindowIcon(),

    autoHideMenuBar: true,

    webPreferences: {

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: true,

      preload: path.join(__dirname, 'preload.cjs'),

    },

  });



  Menu.setApplicationMenu(null);



  // The app is fully local: never open new windows or navigate elsewhere.

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.webContents.on('will-navigate', (event, url) => {

    if (url !== mainWindow.webContents.getURL()) {

      event.preventDefault();

    }

  });



  if (isDev) {

    mainWindow.loadURL(IS_SCHOOL ? 'http://127.0.0.1:5184' : 'http://127.0.0.1:5183');

  } else {

    mainWindow.loadFile(path.join(__dirname, IS_SCHOOL ? '../dist-school/index.html' : '../dist/index.html'));

  }



  mainWindow.on('closed', () => {

    mainWindow = null;

  });



  mainWindow.webContents.on('before-input-event', (_event, input) => {

    if (input.key === 'F11') {

      mainWindow.setFullScreen(!mainWindow.isFullScreen());

    }

  });

}



const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {

  app.quit();

} else {

  app.on('second-instance', () => {

    const [win] = BrowserWindow.getAllWindows();

    if (win) {

      if (win.isMinimized()) win.restore();

      win.focus();

    }

  });



  // The page reports its saved license code; the updater reads it to tell

  // the full version (updates enabled) from the Free Edition. The full

  // checksum validation already ran in the page — main just checks shape.

  ipcMain.handle('kb:set-license', (_event, code) => {

    if (typeof code !== 'string' || !LICENSE_FORMAT.test(code.trim().toUpperCase())) return false;

    try {

      fs.mkdirSync(app.getPath('userData'), { recursive: true });

      fs.writeFileSync(

        path.join(app.getPath('userData'), 'license.json'),

        JSON.stringify({ code: code.trim().toUpperCase() }),

      );

      return true;

    } catch {

      return false;

    }

  });



  app.whenReady().then(() => {

    createWindow();

    scheduleUpdateCheck(() => mainWindow);

  });



  app.on('window-all-closed', () => {

    app.quit();

  });

}

