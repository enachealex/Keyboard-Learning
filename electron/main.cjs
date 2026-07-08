const { app, BrowserWindow, Menu } = require('electron');

const path = require('path');

const { scheduleUpdateCheck } = require('./updater.cjs');



const APP_ID = 'com.keybuddy.app';

const APP_NAME = 'Key Buddy';



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

    mainWindow.loadURL('http://127.0.0.1:5183');

  } else {

    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

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



  app.whenReady().then(() => {

    createWindow();

    scheduleUpdateCheck(() => mainWindow);

  });



  app.on('window-all-closed', () => {

    app.quit();

  });

}

