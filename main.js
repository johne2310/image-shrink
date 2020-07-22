const { app, BrowserWindow, nativeTheme, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const menuTemplate = require('./menu');
const imagemin = require('imagemin');
// const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');
const log = require('electron-log');

// set environment
process.env.NODE_ENV = 'production';

// set production and platform variables
const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

// set mac theming
nativeTheme.themeSource = 'system';

// set variables
let mainWindow;
let aboutWindow;
let menu = Menu.buildFromTemplate(menuTemplate);

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'ImageShrink',
    height: 550,
    width: isDev ? 800 : 500,
    icon: `${ __dirname }/assets/icons/Icon_256x256.png`,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: true
    }
  });

  //if dev mode then open devtools
  if ( isDev ) mainWindow.webContents.openDevTools();

  // mainWindow.loadURL(`file://${__dirname}/app/index.html`)
  mainWindow.loadFile('./app/index.html');

  // set mainWindow to null when closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    aboutWindow = null;
  });

  // set Menu
  Menu.setApplicationMenu(menu);
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: 'About',
    width: 300,
    height: 300,
    x: 200,
    y: 200,
    resizable: false,
    backgroundColor: '#d1d7d6'
  });

  aboutWindow.loadFile('./app/about.html');
  // Listen for close event on aboutWindow and prevent destroying
  aboutWindow.on('close', e => {
    // e.preventDefault();
    // aboutWindow.hide();
  });

  // set mainWindow to null when closed
  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}

// create mainWindow when app is ready
app.on('ready', () => {
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if ( !isMac ) {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if ( BrowserWindow.getAllWindows().length === 0 ) {
    createWindow();
  }
});

// export create about window to use is menu file
exports.openAbout = () => {
  createAboutWindow();
  // console.log('opening about');
};

ipcMain.on('image:minimise', (e, options) => {
  options.destination = path.join(os.homedir(), 'imageshrink');
  log.info('imgDetails: ', options);
  imageShrink(options)
    .catch(e => {
      log.warn('Shrink Error', e.message);
    });
});

// image minimisation
async function imageShrink({ imgPath, quality, destination }) {
  let errCode = 0;
  let newQuality

  if (quality < 25) {
    newQuality  = 'low'
  } else if (quality >24 && quality <50 ) {
    newQuality = 'medium'
  } else if (quality >49 && quality <75) {
    newQuality = 'high'
  } else {
    newQuality = 'veryhigh'
  }

  try {
    log.info('Options:', imgPath, quality, newQuality, destination);

    const pngQuality = quality / 100;

    const files = await imagemin([slash(imgPath)], {
      destination: destination,
      plugins: [
        // imageminMozjpeg({ quality }),
        imageminJpegRecompress( {quality: newQuality} ),
        imageminPngquant({
          quality: [pngQuality, pngQuality]
        })
      ]
    }).catch(e => {
      log.error('.catch error: ', e.message);
      errCode = 1;
    });

    // log.info('files: ', files);
    // log success message
    log.info(
      `imageShrink successful on file ${ imgPath } at quality ${ newQuality }`
    );
    //open file in window
    if ( errCode === 1 ) {
      // let renderer know shrink had an error
      mainWindow.webContents.send('image:error');
    } else {
      // if no error then open folder and communicate success
      shell.openPath(destination).catch(e => {
        log.error('Shell error: ', e.message);
      });
      // let renderer know shrink is complete
      mainWindow.webContents.send('image:done', newQuality);
    }

  }
  catch (e) {
    log.error('try catch error: ', e.message);
  }

}

app.allowRendererProcessReuse = true;
