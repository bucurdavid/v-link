const isDev = require('electron-is-dev');
const path = require('path');
const url = require('url');
const {
  app,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  globalShortcut,
} = require('electron');


// ----------------------- WEBPACK STUFF ------------------------
//app.commandLine.appendSwitch('disable-gpu-vsync');
//app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-gpu');
//app.commandLine.appendSwitch('disable-gpu-compositing');


// ------------------- Electron JSON Storage --------------------
const UserSettings = require('./settings');
const settings = new UserSettings;


// ------------------- Wifi Setup --------------------
var Wifi = require('rpi-wifi-connection');
var wifi = new Wifi();


 //Update status-icon every 5 Seconds
const timer = setInterval(getWifiStatus, 5000);


function getWifiStatus() {
  wifi.getStatus().then((status) => {
    if (status.ssid != null && status.ip_address != null) {
      mainWindow.webContents.send('wifiOn', status);
      if(isDev)console.log(status);
    } else {
      mainWindow.webContents.send('wifiOff');
    }
  })
    .catch((error) => {
      mainWindow.webContents.send('wifiOff');
      console.log('error: ', error);
    });
}

function getWifiNetworks() {
  wifi.scan().then((networks) => {
    mainWindow.webContents.send('wifiList', networks);
    if(isDev)console.log(networks);
  })
    .catch((error) => {
      console.log('error: ', error);
    });
}


function connectWifi(data) {
  wifi.connect({ ssid: data.ssid, psk: data.password }).then(() => {

    wifi.getStatus().then((status) => {
      mainWindow.webContents.send('wifiConnected', ('Connected with IP: ' + status.ip_address));
    })
    console.log('Connected to WiFi network.');
  })
    .catch((error) => {
      mainWindow.webContents.send('wifiConnected', 'Could not connect.');
      console.log('error: ', error);
    });
}

ipcMain.on('wifiUpdate', () => {
  //if(isDev)console.log('Updating Wifi');
  getWifiStatus();
  getWifiNetworks();
});

ipcMain.on('wifiConnect', (event, data) => {
  connectWifi(data);
});

// ------------------- Bluetooth Setup --------------------
//---------------------------------------------------------
//---------------------------------------------------------
//---------------------------------------------------------
//---------------------------------------------------------
//---------------------------------------------------------
//---------------------------------------------------------


// ------------------- Carplay Init --------------------
const { Readable } = require('stream');
const Carplay = require('node-carplay');

const mp4Reader = new Readable({ read(size) { }, });
const keys = require('./bindings.json');


// ------------------- Main Window --------------------
let mainWindow;

function createWindow(data) {
  const startUrl =
    process.env.ELECTRON_START_URL ||
    url.format({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file:',
      slashes: true,
    });


  globalShortcut.register('f5', function () {
    console.log('opening dev tools');
    mainWindow.webContents.openDevTools();
  });


  if (isDev || !(data.carplay.kiosk)) {
    mainWindow = new BrowserWindow({
      width: data.app.windowWidth,
      height: data.app.windowHeight,
      kiosk: false,
      show: false,
      backgroundColor: '#000000',
      webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: false,
      },
    });

    mainWindow.webContents.openDevTools();
  } else {
    mainWindow = new BrowserWindow({
      width: data.app.windowWidth,
      height: data.app.windowHeight,
      kiosk: false,
      show: false,
      frame: false,
      resizable: false,

      backgroundColor: '#000000',

      webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: false
      }
    });
  }


  mainWindow.removeMenu();
  mainWindow.loadURL(startUrl);

  mainWindow.on('ready-to-show', function () {
    console.log('window ready')
    if (!isDev) { mainWindow.setKiosk(true); }
    mainWindow.show();
  });


  let size = mainWindow.getSize();
  mainWindow.on('closed', function () {
    mainWindow = null;
  });


  const config = {
    dpi: data.carplay.dpi,
    nightMode: 0,
    hand: data.carplay.lhd,
    boxName: 'nodePlay',
    width: data.carplay.width,
    height: data.carplay.height,
    fps: data.carplay.fps,
  };

  // ------------------- Carplay Setup --------------------

  if (isDev) console.log('spawning carplay: ', config);
  const carplay = new Carplay(config);


  carplay.on('quit', () => {
    if (isDev) console.log('exiting carplay');
    mainWindow.webContents.send('quitReq');
  });


  ipcMain.on('click', (event, data) => {
    carplay.sendTouch(data.type, data.x, data.y);
    if (isDev) console.log('click: ', data.type, data.x, data.y);
  });


  ipcMain.on('fpsReq', (event) => {
    event.returnValue = data.carplay.fps
  });

  ipcMain.on('statusReq', (event, data) => {
    if (carplay.getStatus()) {
      mainWindow.webContents.send('plugged');
    } else {
      mainWindow.webContents.send('unplugged');
    }
  });


  ipcMain.on('testSetting', (event, { key, subkey, value }) => {
    settings.testSettingChange(key, subkey, value)
      .then(() => {
        console.log('Setting updated successfully.');
      })
      .catch((error) => {
        console.error(error);
      });
  })


  ipcMain.on('getSettings', () => {
    settings.getTestSettings()
      .then((data) => {
        mainWindow.webContents.send('allSettings', data);
      })
      .catch((error) => {
        console.error('Error retrieving settings:', error);
      });
  });


  ipcMain.on('saveSettings', (event, newSettings) => {
    if (isDev) console.log('Saving settings...')
    settings.saveTestSettings(newSettings)
  });


  ipcMain.on('settingsUpdate', (event, { setting, value }) => {
    settings.getTestSettings()
      .then((data) => {
        mainWindow.webContents.send('allSettings', data);
      })
      .catch((error) => {
        console.error('Error retrieving settings:', error);
      });
  });


  ipcMain.on('reqReload', () => {
    app.relaunch();
    app.exit();
  });


  ipcMain.on('reqClose', () => {
    app.quit();
  });


  ipcMain.on('reqReboot', () => {
    const exec = require('child_process').exec;
    exec('sudo reboot -h now', (error, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      console.log(error);
    });
  });


  for (const [key, value] of Object.entries(keys)) {
    if (isDev) {
      return;
    }
    globalShortcut.register(key, function () {
      carplay.sendKey(value);
      if (value === 'selectDown') {
        setTimeout(() => {
          carplay.sendKey('selectUp');
        }, 200);
      }
    });
  }

}


function startUp() {
  settings.getTestSettings()
    .then((data) => {
      createWindow(data);
      createBackgroundWorker(data);
      console.log('Result from getTestSettings: ', data);
    })
    .catch((error) => {
      console.error('Error retrieving settings:', error);
    });
}


app.on('ready', function () {
  //createWindow();
  startUp();
});
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
    clearInterval(timer);
  }
});


// ------------------- Background Worker --------------------

let cache = {
  data: undefined,
};

let hiddenWindow;

function createBackgroundWorker(data) {
  let cache = {
    data: undefined,
  };


  if (data.interface.activateCAN.value) {
    if (isDev) console.log('starting background worker');
    const backgroundFileURL = ''


    if (isDev) {
      backgroundFileUrl = url.format({
        pathname: path.join(__dirname, '../public/background.html'),
        protocol: 'file:',
        slashes: true,
      });


      hiddenWindow = new BrowserWindow({
        width: 150,
        height: 150,
        show: true,
        webPreferences: {
          nodeIntegration: true,
          enableRemoteModule: true,
          contextIsolation: false,
        },
      });
    } else {
      backgroundFileUrl = url.format({
        pathname: path.join(__dirname, '../background.html'),
        protocol: 'file:',
        slashes: true,
      });


      hiddenWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: true,
          enableRemoteModule: true,
          contextIsolation: false,
        },
      });
    }

    hiddenWindow.loadURL(backgroundFileUrl);

    hiddenWindow.on('closed', () => {
      hiddenWindow = null;
    });

  } else {
    if (isDev) console.log('can-stream deactivated.')
  }
}


// Script Setup
ipcMain.on('backgroundReady', (event, args) => {
  event.reply('startPython', {
    data: cache.data,
  });
});

ipcMain.on('stopScript', (event, args) => {
  if (hiddenWindow != null) {
    hiddenWindow.webContents.send('stopPython');
  }
});

ipcMain.on('backgroundClose', (event, args) => {
  if (isDev) console.log('closing background worker');
  hiddenWindow.close();
});

ipcMain.on('msgToMain', (event, args) => {
  mainWindow.webContents.send('msgFromBackground', args.message);
});
