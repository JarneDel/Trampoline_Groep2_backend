import * as db from '../bin/db.js'
import express from "express";
const router = express.Router();


router.get('/', async (req, res) => {
    let data = await db.getResults()
    console.log(data)
    res.json(data)
})
router.post('/', async (req, res) =>{
    let name = req.body.name;
    let score = req.body.score;
    let data = await db.postResults(name, score)
    console.log(data)
    if (data > 0){
        res.sendStatus(201);
    }else{
        res.sendStatus(500);
    }
})


export default router