import express from "express";
import {getRandomName} from "../bin/nameGeneration.js";
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.json(getRandomName());
});

export default router;