import * as mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();
const password = process.env.SQL_PASSWORD;
const config = {
  host: "localhost",
  user: "root",
  password: password,
  database: "groepprojdb",
};

export async function getResults() {
  const conn = mysql.createPool(config);
  const pool = conn.promise();
  let [rows, fields] = await pool.query("SELECT * FROM statistics");
  return rows;
}

export async function postResults(name, score) {
  const conn = mysql.createPool(config);
  const pool = conn.promise();
  let [rows, fields] = await pool.query("INSERT INTO statistics (username, score) VALUES (?, ?);", [name, score]);
  return rows.affectedRows;
}
