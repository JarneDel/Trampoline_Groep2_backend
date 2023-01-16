import express from "express";
import {getRandomName} from "../bin/nameGeneration.js";
import {getRandomAvatar} from "../bin/avatar.js";
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.json(getRandomName());
});

router.get('/avatar', function (req, res){
  res.send(getRandomAvatar())
})

export default router;