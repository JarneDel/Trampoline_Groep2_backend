let btnState = {
    0: false,
    1: false,
}

let btn = [false, false, false]


export function updateBtn(btnNumber, value) {
    btnState[btnNumber] = value
    btn[btnNumber] = value
    btn[2] = btn[0] && btn[1];
    return {btn: btn}
}