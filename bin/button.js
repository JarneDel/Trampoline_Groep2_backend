let btnState = {
    0: false,
    1: false,
}

export function updateBtn(btnNumber, value) {
    btnState[btnNumber] = value
    if (btnState[0] && btnState[1]){
        return {btn: 'both'}
    }
    else if (btnState[0]){
        return {btn: 1}
    }else if (btnState[1]){
        return {btn: 2}
    }
}