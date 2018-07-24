const electron = require('electron')
const dialog = electron.remote.dialog
const path = require('path')
const locale = require('./locale')
const utils = require('./utils')
const { remote } = require('electron')
const { Menu, MenuItem } = remote
const Store = require('electron-store')
const store = new Store()
const urllib = require('url')
const fs = require('fs')


document.addEventListener('DOMContentLoaded', function () {
  console.log("init window")
  locale.init()

  $('#btn_devtool').click(() => {
    $('#webview').get(0).openDevTools()
  })

  $('.btn_reload').click(() => {
    on_click_reload()
  })

  $('#btn_back').click(() => {
    if ($('#webview').get(0).canGoBack()) {
      $('#webview').get(0).goBack()
    }
  })

  init_webview()

  $('#input_address').val('http://www.gameres.com/815232.html')
  init_domain_area()

  $('#record_space').scroll(function (e) {
    //bug: 目前scroll到底部后时，切换一组record时，会错误的触发本事件，而导致同一组some-records会出现两次。因而增加判断当前的record的数量来屏蔽此错误。
    // console.log(e.target.scrollTop, $(window).height(), e.target.clientHeight, $('#record_list').height())
    if ($('.record').length > 0 &&
      g_record_no_more == false &&
      e.target.scrollTop + $(window).height() >= $('#record_list').height() - 50) {
      console.log('get more record')
      get_some_records()
    }
  })

  get_some_records()

  $('#btn_search').click(() => {
    g_record_no_more = false
    $('#record_space').empty()
    g_record_element_map = {}
    get_some_records()
  })

  $('.btn_sync_address').click(update_from_address)

  $('#btn_export').click(on_click_export)

  $('#input_address').get(0).addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      on_click_reload()
    }
  })
})

function on_click_reload() {
  let address_text = $('#input_address').val()

  if (!address_text.includes('://')) {
    address_text = "http://" + address_text
  }

  $('#input_address').val(address_text)
  $('#webview').get(0).loadURL(address_text)
}


function get_some_records() {
  electron.ipcRenderer.send('get-some-records',
    {
      offset: $('#record_space .record').length,
      query: $('#input_search').val().trim()
    })
}

function init_webview() {

  let web_raw = $('#webview').get(0)

  web_raw.addEventListener('contextmenu', function (event) {
    console.log('right-click')
  })


  web_raw.addEventListener('console-message', (e) => {
    console.log('Guest message:', e.message)
  })

  // web_raw.addEventListener('load-commit', on_webview_load_commit.bind(null, web))
  web_raw.addEventListener('did-start-loading', () => {
    note('loading')
  })
  // web_raw.addEventListener('did-stop-loading', ())
  web_raw.addEventListener('did-finish-load', () => {
    note('load complete')
  })
  web_raw.addEventListener('did-fail-load', () => {
    if (event.isMainFrame) {
      if (event.errorCode != -3 && event.errorCode != -20 && event.errorCode != 0) {
        note(event.errorDescription)
      }
    }
  })
  web_raw.addEventListener('will-navigate', (event) => {
    console.log(event)
    $('#input_address').val(event.url)
  })
  web_raw.addEventListener('did-navigate', (event) => {
    console.log(event)
    $('#input_address').val(event.url)
  })
  web_raw.addEventListener('new-window', (event) => {
    $('#webview').get(0).loadURL(event.url)
  })
  // web_raw.addEventListener('will-download', on_webview_will_download.bind(null, web))
  // web_raw.addEventListener('page-favicon-updated', on_page_favicon_updated.bind(null, web))
  web_raw.addEventListener('dom-ready', function () {
    console.log('dom ready')
  })
}

function update_from_address() {
  let url = $('#input_address').val()
  let myurl = urllib.parse(url)
  $('#input_domain').val(myurl.host)
  $('#input_test_url').val(url)
  console.log(myurl)
}

function init_domain_area() {
  $('#btn_inject').click(() => {
    $('#webview').get(0).insertCSS(remove_new_line($('#input_css').val()))
  })

  $('#btn_save').click(() => {
    electron.ipcRenderer.send('save-record', {
      domain: $('#input_domain').val().trim(),
      test_url: $('#input_test_url').val().trim(),
      css: $('#input_css').val().trim(),
      date: new Date().getTime(),
      extra: ''
    })
  })

  $('#btn_delete').dblclick(() => {
    console.log('delete')
    electron.ipcRenderer.send('delete-record', $('#input_domain').val().trim())
  })
}

function note(text) {
  $('#note').text(text)
}

let g_record_data_map = new Map()
let g_record_element_map = {}
function add_new_record_element(record, at_top) {
  let new_element = $('#record_template').clone()
  new_element.find('.record-domain').text(record.domain)
  new_element.attr('domain', record.domain)
  new_element.click(() => {
    on_click_record(record.domain)
  })
  g_record_element_map[record.domain] = new_element

  if (at_top) {
    new_element.prependTo('#record_space')
  } else {
    new_element.appendTo('#record_space')
  }
}

electron.ipcRenderer.on('new-record', (event, record) => {
  g_record_data_map.set(record.domain, record)
  add_new_record_element(record, true)
})

electron.ipcRenderer.on('update-record', (event, record) => {
  g_record_data_map.set(record.domain, record)
})

let g_record_no_more = false
electron.ipcRenderer.on('some-records', function (e, records) {
  console.log('all records', records)
  records.forEach(function (record) {
    g_record_data_map.set(record.domain, record)
    add_new_record_element(record, false)
  })
  g_record_no_more = false
  if (records.length == 0) {
    g_record_no_more = true
    console.log('no more records')
  }
})

function on_click_record(domain) {
  let record = g_record_data_map.get(domain)
  if (record) {
    console.log(record)
    $('#webview').get(0).loadURL(record.test_url)
    $('#input_domain').val(record.domain)
    $('#input_test_url').val(record.test_url)
    $('#input_css').val(record.css)
  }
}

function get_month_date() {
  let date = new Date()
  return `${date.getMonth() + 1}-${date.getDate()}`
}

let g_export_path = null
function on_click_export() {
  dialog.showSaveDialog(
    { defaultPath: `irreader-readmode-rules-${get_month_date()}.txt` },
    (filename) => {
      console.log('write opml to', filename)
      g_export_path = filename
      electron.ipcRenderer.send('get-export-records')
    })
}

function remove_new_line(text) {
  return text.replace(/(\r\n\t|\n|\r\t)/gm, '')
}

electron.ipcRenderer.on('export-records', (event, records) => {
  if (g_export_path) {
    console.log('export', records.length)
    note('start exporting')
    let lines = []
    records.forEach((record) => {
      let record_line = `${record.domain.trim()}##${record.css.trim()}`
      record_line = remove_new_line(record_line)
      lines.push(record_line)
    })
    fs.writeFile(g_export_path, lines.join('\n'), () => {
      alert('Exported to' + g_export_path)
    })
  }
})

electron.ipcRenderer.on('delete-record', (event, domain) => {
  g_record_data_map.delete(domain)
  g_record_element_map[domain].remove()
})