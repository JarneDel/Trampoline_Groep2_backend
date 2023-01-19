import express from "express";
import {getRandomName} from "../bin/nameGeneration.js";
import {getRandomAvatar} from "../bin/avatar.js";
import sharp from "sharp";
import fs from "fs";

const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {
    res.json(getRandomName());
});

router.post('/avatar/', async function (req, res) {
    let id = req.body.id;
    let avatarSvg = getRandomAvatar()
    // convert 156 px to 512 px
    const density = 512 / 156 * 100;
    const compressionLevel = 5;
    let avatarPng = await sharp(Buffer.from(avatarSvg), {density})
        .png({compressionLevel})
        .toBuffer()
    res.type('png').send(avatarPng)
    // save to file
    let imgRes = await sharp(Buffer.from(avatarPng))
        .toFile(`public/avatars/${id}.png`)
    console.log(imgRes)
})


router.get('/avatar/:id', function (req, res) {
    fs.readFile(`public/avatars/${req.params.id}.png`, (err, data) => {
        if (err) {
            res.status(404).send('Not found')
        } else {
            res.type('png').send(data)
        }
    })
})

export default router;