import * as mysql from 'mysql2'
import dotenv from 'dotenv'
dotenv.config()
const password = process.env.SQL_PASSWORD
const config = {
    host: "localhost",
    user: "root",
    password: password,
    database: 'database'
};

export async function example1 () {
    const conn = mysql.createPool(config);
    const pool = conn.promise();
    let [rows, fields] = await pool.query('SELECT * FROM statistics');
    console.log(rows)
    return rows
}
example1()