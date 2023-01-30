let btnState = [false, false]
let btn = [false, false, false]

export function getButtonState(btnNumber, value) {
    let out = {};
    btnState[btnNumber] = value;

    if(btnState[0] && btnState[1] && !btn[2]){
        btn[2] = true;
        out.both = "pressed";
    }
    if((!btnState[0] || !btnState[1]) && btn[2]){
        btn[2] = false;
        out.both = "released";
    }
    if (btnState[btnNumber] && !btn[btnNumber]) {
        btn[btnNumber] = true;
        out[btnNumber] = "pressed";
    }
    if (!btnState[btnNumber] && btn[btnNumber]) {
        btn[btnNumber] = false;
        out[btnNumber] = "released";
    }
    if (Object.keys(out).length === 0) return null;

    return {btn: out};

}