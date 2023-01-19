import express from "express";
import {getRandomName} from "../bin/nameGeneration.js";
import {getRandomAvatar} from "../bin/avatar.js";
import sharp from "sharp";
import fs from "fs";
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.json(getRandomName());
});

router.post('/avatar/', async function (req, res){
  let id = req.body.id;
  let avatarSvg = getRandomAvatar()
  // convert 156 px to 512 px
  let density = 512/156 * 100;
  let avatarPng = await sharp(Buffer.from(avatarSvg), {density}).png().toBuffer()
  res.type('png').send(avatarPng)
  let imgRes = await sharp(Buffer.from(avatarSvg), {density}).png().toFile(`public/avatars/${id}.png`)
  console.log(imgRes)
})


router.get('/avatar/:id', function (req, res){
  res.send(getRandomAvatar())
})

export default router;