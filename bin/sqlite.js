import sqlite3 from 'sqlite3';
const Database = sqlite3.Database;

const db = new Database('db.sqlite')
let tableExists = false

function createTable() {
    if (tableExists) return
    db.run('CREATE TABLE IF NOT EXISTS statistics (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, score INTEGER, date DATETIME DEFAULT CURRENT_TIMESTAMP);')
    tableExists = true
}


export async function getResults() {
    // create table if not exists
    createTable()
    // get all rows
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM statistics', (err, rows) => {
            if (err) reject(err)
            resolve(rows)
        })
    })
}



export const getUserById = (id) => {
    createTable()
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM statistics WHERE id = ?', [id], (err, row) => {
            if (err) reject(err)
            resolve(row)
        })
    })
}

export const postResults = (name, score) => {
    createTable()
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO statistics (username, score) VALUES (?, ?);', [name, score], function (err) {
            if (err) reject(err)
            resolve(this.lastID)
        })
    })
}

export const updateResults = (id, name) => {
    createTable()
    return new Promise((resolve, reject) => {
        db.run('UPDATE statistics SET username = ? WHERE id = ?;', [name, id], function (err) {
            if (err) reject(err)
            resolve(this.changes)
        })
    })
}



