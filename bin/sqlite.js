import {Database} from 'sqlite3'

const db = new Database('db.sqlite')

export async function getResults() {
    try{
        let [rows] = await db.all("SELECT * FROM statistics");
        return rows;
    }catch (e){
        console.warn(e)
        return null;
    }

}
