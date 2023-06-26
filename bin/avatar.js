import { createAvatar } from '@dicebear/core';
import { avataaarsNeutral } from '@dicebear/collection';
import sharp from "sharp";

export function getRandomAvatar() {
    const avatar = createAvatar(avataaarsNeutral, {
        seed: Math.random() * 10000,
        backgroundColor: ["A9DDB2", "b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf",]

    });
    return avatar.toString()
}

export function getRandomAvatarWithSeed(seed) {
    const avatar = createAvatar(avataaarsNeutral, {
        seed: seed,
        backgroundColor: ["A9DDB2", "b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf",]
    });
    return avatar.toString()
}

export const convertSvgToPng = async (svg) => {
    const density = 512 / 156 * 100;
    const compressionLevel = 5;
    let avatarPng = await sharp(Buffer.from(svg), { density })
        .png({ compressionLevel })
        .toBuffer()
    return avatarPng
}