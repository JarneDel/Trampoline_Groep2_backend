import {createAvatar} from '@dicebear/core';
import {avataaarsNeutral} from '@dicebear/collection';

export function getRandomAvatar() {
    const avatar = createAvatar(avataaarsNeutral, {
        seed: Math.random() * 10000,
        backgroundColor: ["A9DDB2", "b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf",]
    });
    return avatar.toString()
}
