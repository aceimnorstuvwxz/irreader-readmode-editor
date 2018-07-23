const electron = require('electron')
const path = require('path')
const Store = require('electron-store')
const store = new Store()

exports.app_theme_dev = false
exports.is_dev = false //<<<<<<
exports.is_mas = false //是否是给mas编译 //<<<<<<<

let g_is_cn = is_win()? true : (electron.app ? electron.app.getLocale() : electron.remote.app.getLocale()) == 'zh-CN' //<<<<<<
//win下始终是中文

exports.is_cn = g_is_cn
exports.lg = (cn, en) => {
    return g_is_cn ? cn : en
}


function version_string_2_code(ver) {
    //x.x.x
    let arr = ver.split('.')
    arr = arr.map(x => parseInt(x))
    let sum = 10000 * arr[0] + 100 * arr[1] + 1 * arr[2]
    return sum
}

function is_mac() {
    return process.platform == 'darwin'
}

function is_win() {
    return !is_mac()
}


function random_select(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

exports.version_string_2_code = version_string_2_code
exports.is_win = is_win
exports.is_mac = is_mac
exports.random_select = random_select
exports.TARGET_STATE = { //未使用
    NORMAL: 0,
    PAUSED: 1
}

exports.RECORD_STATE = {
    UNREAD: 0,
    READ: 1,
    STAR: 2
}

exports.record_state_to_text = function (state) {
    switch (state) {
        case exports.RECORD_STATE.UNREAD:
            return 'unread'

        case exports.RECORD_STATE.READ:
            return 'read'

        case exports.RECORD_STATE.STAR:
            return 'star'

        default:
            console.log("illegal state", state)
            return 'illegal'
    }
}

exports.TARGET_TYPE = {
    HTML: 0,
    XML: 1,
    JSON: 2
}

exports.RECORD_TYPE = {
    ARTICLE: 0,
    PODCAST: 1
}

exports.RECORD_FILTER = {
    ALL: 0,
    UNREAD: 1,
    FAV: 2
}

exports.len = function (text) {
    return Buffer.byteLength(text, 'utf8')
}

exports.remove_hash = function (url) {
    return url.split('#')[0]
}

exports.data_file = (fn) => {
    return path.join(electron.app.getPath('userData'), fn)
}

exports.remote_data_file = (fn) => {
    return path.join(electron.remote.app.getPath('userData'), fn)
}

exports.WEB_ERROR_TYPE = {
    NONE: 0,
    DOWNLOAD: 1,
    LOAD_FAIL: 2
}

function pad(num) {
    return ("0" + num).slice(-2);
}

exports.mmss = (secs) => {
    secs = Math.floor(secs)
    let minutes = Math.floor(secs / 60);
    secs = secs % 60;
    return '' + minutes + ":" + pad(secs)
}

exports.escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const g_config_default = {
    notify: true,
    no_disturb: true, //在11点至次日9点不提醒
    check_interval: 'C',
    launch_at_login: !exports.is_mas,
    proxy: '',
    adb: false, //默认关闭adb，首次打开时更新规则
    jsb: false,
    gif: false
}

const g_config_name = "config_v9"

exports.get_config = () => {
    return store.get(g_config_name, g_config_default)
}

exports.set_config = (config) => {
    store.set(g_config_name, config)
}

exports.get_userData = () => {
    return electron.app ? electron.app.getPath('userData') : electron.remote.app.getPath('userData')
}

exports.timeout = 20 //timeout secs
exports.webview_check_wait_max = 20 //从开始后，最长的等待时间，若到时还未dom-ready，则放弃
exports.webview_check_dom_delay = 5 //dom-ready后，等待这段时间留给scripting，然后开始执行check

exports.UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36 LikeFeed/0.1.0"


exports.safe_json_parse = (text) => {
    r = {}
    try {
        r = JSON.parse(text)
    } catch (e) {
    }
    r = r ? r : {}
    return r
}

exports.UNIQUE_TYPE = {
    LINK: 0,
    TITLE: 1
}

exports.get_embedded_url = () => {
    return 'http://irreader.netqon.com/embedded.html?t=' + Date.now() + `&lan=${g_is_cn ? 'zh' : 'en'}`
}


exports.get_theme_url = () => {
    return 'http://irreader.netqon.com/themes.html?t=' + Date.now() + `&lan=${g_is_cn ? 'zh' : 'en'}`
}

exports.get_file_ext = (p) => {
    let t = p.split('.').pop()
    t = t.split('#')[0]//remove hash
    t = t.split('?')[0] //remove query part
    return t.toLowerCase()
}

exports.get_store_url = () => {
    return 'http://irreader-s.netqon.com:8080/feedonline/target/store' + `?lan=${g_is_cn ? 'zh' : 'en'}`
}

exports.get_product_site_url = () => {
    return 'http://irreader.netqon.com'
}

exports.get_easylist_url = () => {
    return 'http://irreader.netqon.com/easylist.txt?t' + Date.now()
}