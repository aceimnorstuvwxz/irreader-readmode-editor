
const electron = require('electron')
const path = require('path')
const locale = require('./locale')
const utils = require('./utils')

document.addEventListener('DOMContentLoaded', function () {
  console.log("update init")
  locale.init()
  $('body').text('irreader readmode editor v' + electron.remote.app.getVersion())
})
