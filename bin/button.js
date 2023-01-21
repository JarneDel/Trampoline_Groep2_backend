let btnState = [false, false]
let btn = [false, false, false]



export function updateBtn(btnNumber, value) {
    let out = {};
    btnState[btnNumber] = value;

    if(btnState[0] && btnState[1] && !btn[2]){
        btn[2] = true;
        out.both = true;
    }
    if((!btnState[0] || !btnState[1]) && btn[2]){
        btn[2] = false;
        out.both = false;
    }
    if (btnState[btnNumber] && !btn[btnNumber]) {
        btn[btnNumber] = true;
        out[btnNumber] = true;
    }
    if (!btnState[btnNumber] && btn[btnNumber]) {
        btn[btnNumber] = false;
        out[btnNumber] = false;
    }
    if (Object.keys(out).length === 0) return null;

    return {btn: out};

}