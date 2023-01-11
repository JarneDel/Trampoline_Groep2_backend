import * as mysql from 'mysql'
import dotenv from 'dotenv'
dotenv.config()

export const sqlConnection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: 'database',
    password: process.env.SQL_PASSWORD
});

sqlConnection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

export function sqlRequest(userId){
    sqlConnection.query('SELECT * FROM statistics WHERE id = ?', [userId], function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        // ...
    });
}
