import * as mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();
const password = process.env.SQL_PASSWORD;
const database = process.env.DB_NAME;
const config = {
  host: "localhost",
  user: "root",
  password: password,
  database: database,
};

export async function getResults() {
  try{
    const conn = mysql.createPool(config);
    const pool = conn.promise();
    let [rows] = await pool.query("SELECT * FROM statistics");
    return rows;
  }catch (e){
    console.warn(e)
    return null;
  }

}

export async function postResults(name, score) {
  try {
    const conn = mysql.createPool(config);
    const pool = conn.promise();
    let [rows] = await pool.query("INSERT INTO statistics (username, score) VALUES (?, ?);", [name, score]);
    return rows.affectedRows;
  }catch (e) {
    console.warn(e)
    return false
  }
}
