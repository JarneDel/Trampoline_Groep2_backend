
import {uniqueNamesGenerator} from "unique-names-generator";
import dict from "../assets/nameList.json" assert { type: 'json'};

export function getRandomName() {
    return  uniqueNamesGenerator({
        // dictionaries: [dict.adjectives, dict.name],
        dictionaries: [dict.kleuren, dict.dieren],
        length: 2,
        separator: '',
        style: "capital",
    }); // big-donkey
}

