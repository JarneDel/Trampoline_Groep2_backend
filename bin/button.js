let buttonState = {
    0: false,
    1: false,
}

export function updateBtn(btnNumber, value) {
    buttonState[btnNumber] = value
    if (buttonState[0] && buttonState[1]){
        return {btn: 'both'}
    }
    else if (buttonState[0]){
        return {btn: 1}
    }else if (buttonState[1]){
        return {btn: 2}
    }
}