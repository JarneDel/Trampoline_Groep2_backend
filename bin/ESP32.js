import {SerialPort} from 'serialport';
import {ReadlineParser} from '@serialport/parser-readline';
import {updateBtn} from "./button.js";

const getSerialPort = function (portNumber, baudRate, socket) {
    try {
        baudRate = Number(baudRate) || 115200;
        return new SerialPort({path: portNumber, baudRate: baudRate}, function (err) {
            if (err) {
                return console.log(`Error with ${portNumber}: `, err.message)
            }
        });
    } catch (e) {
        socket.send(JSON.stringify({log: e.message}));
    }
}


export const SerialSocket = function (socket, portNumber, baudRate) {
    try {
        console.info('SerialSocket: ', portNumber, baudRate);
        const serial = getSerialPort(portNumber, baudRate, socket);
        const parser = serial.pipe(new ReadlineParser({delimiter: '\r\n'}));
        serial.on('open', async function () {
            console.log('Serial port connected');
            serial.write('IDENTIFY\r\n');
        });

        // ...
        socket.on('close', (reason) => {
            console.log("Connection closed: ", reason);
            serial.isOpen && serial.close();
        });
        socket.on('message', function (msg) {
            let data = JSON.parse(msg)
            if ("stop" in data) {
                console.log("Serial port stopped")
                serial.isOpen && serial.close();
            }
            if ("start" in data) {
                console.log("Serial port started")
                !serial.isOpen && serial.open()
            }
        });
        return parser;
    } catch (error) {
        console.log(error)
        socket.send(JSON.stringify({log: error}));
    }

}

export const handleData = function (raw, id, socket) {
    // convert left / right from id to index
    let index = null
    if (id === "left") index = 0
    if (id === "right") index = 1

    let data = JSON.parse(raw)
    if("id" in data){
        console.log("ID: ", data.id)
        return data.id
    }

    if ("ButtonState" in data && index !== null) {
        let btnState = updateBtn(index, data.ButtonState)
        if (btnState === null) return
        console.log("btnUpdate", index,  data.ButtonState)
        socket.send(JSON.stringify({button: btnState}))
    }

}
