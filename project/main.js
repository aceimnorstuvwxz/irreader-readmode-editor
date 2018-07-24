const electron = require('electron')
const { app, BrowserWindow, Menu, ipcMain, globalShortcut, crashReporter } = electron;
const utils = require('./utils')
const main_utils = require('./main_utils')
const Store = require('electron-store')
const store = new Store()
const path = require('path')
const urllib = require('url')
const fs = require('fs')
const db = require('./db')
console.log('userData=', app.getPath('userData'))

db.database_init()

app.on('ready', function () {
  createMainWindow()//启动后，并不打开主窗口
  const menu = Menu.buildFromTemplate(get_menu_template())
  Menu.setApplicationMenu(menu)
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createMainWindow() //点击dock的图标，能够打开主窗口
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})


/* menu */
function lg(cn, en) {
  return app.getLocale() == 'zh-CN' ? cn : en;
}

function get_menu_template() {
  //locale在app ready之前，无法返回正确的值
  const menuTemplate = [
    {
      label: lg('文件', 'File'),
      submenu: [
        // {
        //   label: lg('新增目标', 'New Target'),
        //   accelerator: 'CmdOrCtrl+N',
        //   click() {
        //     main_utils.notify_all_windows('open-new-target', {})
        //   }
        // }
      ]
    },
    {
      label: lg('编辑', 'Edit'),
      submenu: [
        { role: 'undo', label: lg('撤销', 'Undo') },
        { role: 'redo', label: lg('恢复', 'Redo') },
        { type: 'separator' },
        { role: 'cut', label: lg('剪切', 'Cut') },
        { role: 'copy', label: lg('复制', 'Copy') },
        { role: 'paste', label: lg('粘贴', 'Paste') },
        { role: 'selectall', label: lg('全选', 'Select All') }
      ]
    },
    {
      label: lg('查看', 'View'),
      submenu: [
        { role: 'reload', label: lg('刷新', 'Reload') },
        {role: 'forcereload'},
        {role: 'toggledevtools'},
        // {type: 'separator'},
        { role: 'zoomin', label: lg('放大', 'Zoom In') },
        { role: 'zoomout', label: lg('缩小', 'Zoom Out') },
        { role: 'resetzoom', label: lg('重置缩放', 'Reset Zoom') },
        { type: 'separator' },
        { role: 'togglefullscreen', label: lg('切换全屏', 'Toggle Fun Screen') }
      ]
    },
    {
      role: 'window',
      label: lg('窗口', 'Window'),
      submenu: [
        { role: 'minimize', label: lg('最小化', 'Minimize') },
        { role: 'close', label: lg('关闭', 'Close') }
      ]
    },
    {
      role: 'help',
      label: lg('帮助', 'Help'),
      submenu: [
        {
          label: lg('反馈', 'Feedback'),
          click() { require('electron').shell.openExternal('https://github.com/fateleak/irreader-readmode-editor') }
        },
        {
          label: lg('了解更多', 'Learn More'),
          click() { require('electron').shell.openExternal('http://irreader.netqon.com') }
        }
      ]
    }
  ]


  if (utils.is_mac()) {
    menuTemplate.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: lg('关于 irreader readmode editor', 'About irreader readmode editor') },
        { type: 'separator' },
        { role: 'services', label: lg('服务', 'Services'), submenu: [] },
        { type: 'separator' },
        { role: 'hide', label: lg('隐藏 irreader readmode editor', 'Hide irreader readmode editor') },
        { role: 'hideothers', label: lg('隐藏其它', 'Hide Others') },
        { role: 'unhide', label: lg('显示全部', 'Show All') },
        { type: 'separator' },
        { role: 'quit', lable: lg('退出', 'Quit') }
      ]
    })

    // mac's Window menu
    menuTemplate[4].submenu = [
      { role: 'close', label: lg('关闭', 'Close') },
      { role: 'minimize', label: lg('最小化', 'Minimize') },
      { role: 'zoom', label: lg('缩放', 'Zoom') },
      { type: 'separator' },
      { role: 'front', label: lg('全部置于顶层', 'Bring All to Front') }
    ]
  } else {
    //For Win32, add settings and Exit
    menuTemplate[0].submenu.push(
      // {
      //   label: lg('设置', 'Settings'),
      //   click() { createSettingWindow() },
      //   accelerator: 'Ctrl+,'

      // }
    )

    menuTemplate[0].submenu.push(
      { type: 'separator' }
    )
    menuTemplate[0].submenu.push(
      {
        role: 'quit',
        label: lg('退出', 'Exit'),
        accelerator: 'Ctrl+q'
      }
    )

    menuTemplate[4].submenu.unshift(
      // {
      //   role: 'about',
      //   label: lg('关于 OpenWebMonitor', 'About OpenWebMonitor'),
      //   click() { openAboutWindow() }
      // }
    )
  }

  if (utils.is_dev) {
    menuTemplate.push({
      label: 'Dev',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        {
          label: 'test crash',
          click() { process.crash() }
        },
        {
          label: 'relaunch',
          click() {
            app.relaunch()
            app.exit(0)
          }
        }
      ]
    })
  }

  return menuTemplate
}

let mainWindow

function createMainWindow() {
  if (mainWindow == null) {

    let main_win_option = {
      width: store.get('width', 1150),
      height: store.get('height', 700)
    }
    if (utils.is_mac()) {
      // main_win_option.titleBarStyle = 'hidden'
    } else {
      // main_win_option.frame = false
    }
    mainWindow = new BrowserWindow(main_win_option)

    mainWindow.loadURL(urllib.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }))

    mainWindow.webContents.on('new-window', function (event, url) {
      event.preventDefault();
      electron.shell.openExternal(url)
    })

    mainWindow.on('closed', function () {
      mainWindow = null
      if (utils.is_mac()) {
        app.dock.hide() //dock图标随主窗口关闭
      }
    })

    if (utils.is_mac()) {
      app.dock.show() // dock图标随主窗口
    }
  } else {
    mainWindow.show()
  }

}

ipcMain.on('save-record', (event, record)=>{
  console.log('save-record', record)
  db.save_or_update_record(record)
})

ipcMain.on('delete-record', (event, domain)=>{
  db.delete_record(domain)
})

ipcMain.on('get-some-records', (event, data)=>{
  db.get_some_records(data.offset, data.query, function (records) {
    main_utils.notify_all_windows('some-records', records)
  })
})


ipcMain.on('get-export-records', (event, data)=>{
  db.get_all_records(function(records){
    main_utils.notify_all_windows('export-records', records)
  })
})