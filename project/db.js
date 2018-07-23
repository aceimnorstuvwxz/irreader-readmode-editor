const sqlite3 = require('sqlite3').verbose()
const electron = require('electron')
const Store = require('electron-store')
const store = new Store()
const path = require('path')
const utils = require('./utils')
const main_utils = require('./main_utils')
let g_db = null


let g_record_sql = `
CREATE TABLE if not exists "record" (
  "domain" text primary key,
  "test_url" text,
  "css" text,
  "date" integer,
  "extra" text
);`

let g_index_sqls = []

//对config的特别说明，在本文件内，config做好与string的转换。
//确保config的存在，对内容字段不做保证。

exports.database_init = () => {
    store.set('dbversion', '1')

    g_db = new sqlite3.Database(path.join(utils.get_userData(), "irreader-readmode-editor.db"))

    g_db.serialize(function () {
        g_db.run(g_record_sql)
    })

    if (!store.get('db_inited', false)) {
        g_db.serialize(function () {
            g_index_sqls.forEach((sql) => {
                g_db.run(sql)

            })
        })
        console.log('database inited')
        store.set('db_inited', true)
    }

}

exports.save_or_update_record = (record) => {

    g_db.serialize(function () {
        g_db.run(`INSERT INTO record(domain, test_url, css, date, extra) VALUES(?, ?, ?, ?, ?)`,
            record.domain, record.test_url, record.css, record.date, record.extra,
            (err) => {
                if (err) {
                    console.error(err.message)
                    update_record(record)
                } else {
                    main_utils.notify_all_windows('new-record', record)
                }
            })
    })
}

function update_record(record) {
    g_db.serialize(function () {
        g_db.run(`UPDATE record SET test_url=?, css=?, date=?, extra=? WHERE domain=?`,
            [record.test_url, record.css, record.date, record.extra, record.domain],
            function (err) {
                if (err) {
                    console.error(err.message);
                } else {
                    main_utils.notify_all_windows('update-record', record)
                }
            })
    })
}

exports.delete_record = (domain) => {
    g_db.serialize(function () {
        g_db.run(`DELETE FROM record  WHERE domain=?`, [domain],
            function (err) {
                if (err) {
                    console.error(err.message)
                }
            })
    })
}

exports.get_some_records = (offset, query, cb) => {

    g_db.serialize(function () {
        let sql = `SELECT  * 
        FROM record  ORDER BY date DESC LIMIT 30 OFFSET ${offset} `;

        if (query) {
            sql = `SELECT  * 
        FROM record WHERE domain like '%${query}%'  ORDER BY date DESC LIMIT 30 OFFSET ${offset} `;
        }

        g_db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            if (cb) {
                cb(rows)
            }
        })
    })
}