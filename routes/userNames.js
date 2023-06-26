import express from "express";
import { getRandomName } from "../bin/nameGeneration.js";
import { convertSvgToPng, getRandomAvatarWithSeed } from "../bin/avatar.js";
import sharp from "sharp";

const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {
    res.json(getRandomName());
});

router.post('/avatar/', async function (req, res) {
    let id = req.body.id;
    let avatarSvg = getRandomAvatarWithSeed(id)
    // convert 156 px to 512 px
    const density = 512 / 156 * 100;
    const compressionLevel = 5;
    let avatarPng = await sharp(Buffer.from(avatarSvg), { density })
        .png({ compressionLevel })
        .toBuffer()
    res.type('png').send(avatarPng)
})


router.get('/avatar/:id', async function (req, res) {
    console.log(req.params.id);
    const avatar = getRandomAvatarWithSeed(req.params.id)
    const density = 512 / 156 * 100;
    const compressionLevel = 5;
    let avatarPng = await sharp(Buffer.from(avatar), { density })
        .png({ compressionLevel })
        .toBuffer()
    res.type('png').send(avatarPng)
})

export default router;