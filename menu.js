const { app } = require('electron');
const main = require('./main');

// set environment
process.env.NODE_ENV = 'production';
const isMac = process.platform === 'darwin';
const isDev = process.env.NODE_ENV !== 'production';

// menus
const menuTemplate = [
  // user spread operator to test if Mac then add appMenu
  ...(isMac
    ? [
        {
          role: 'appMenu'
        }
      ]
    : []),
  {
    label: 'Help',
    submenu: [
      {
        label: 'About',
        click: () => {
          // console.log(main.openAbout());
          main.openAbout();
        }
      }
    ]
  },
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' }
          ]
        }
      ]
    : [])
];

// export menuTemplate (then require in main.js)
module.exports = menuTemplate;
