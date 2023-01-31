import serialport, {SerialPort} from 'serialport';
import {ReadlineParser} from '@serialport/parser-readline';
import {getButtonState} from "./button.js";
import {_socket} from "./wsHandler.js";

const getSerialPort = function (portNumber, baudRate) {
    try {
        baudRate = Number(baudRate) || 115200;
        return new SerialPort({path: portNumber, baudRate: baudRate}, function (err) {
            if (err) {
                return console.log(`Error with ${portNumber}: `, err.message)
            }
        });
    } catch (e) {
        _socket.send(JSON.stringify({log: e.message}));
    }
}

const SerialSocket = function (portNumber, baudRate) {
    let _id = null;
    try {
        console.log('connecting to: ', portNumber, baudRate);
        const serial = getSerialPort(portNumber, baudRate);
        const parser = serial.pipe(new ReadlineParser({delimiter: '\r\n'}));
        // turn button LED on
        serial.write(`ON\r\n`);
        // send identification to know left and right esp
        serial.on('open', async function () {
            console.log('Serial port connected');
            try {
                serial.write('IDENTIFY\r\n');
            } catch (e){
                console.log("error writing to serial port", e);
            }

        });

        parser.on('data', (data) => {
            try {
                data = JSON.parse(data);
                if ("id" in data) _id = data.id;
            } catch (e) {
                console.warn("error parsing esp data", e);
            }
        });

        // listen for socket close and close serial port
        _socket.on('close', () => {
            sendLedState({id: _id, led: "off"}, serial, _id)
            serial.isOpen && serial.close();
        });

        _socket.on('message', function (msg) {
            try {
                let data = JSON.parse(msg)
                if ("stop" in data) {
                    console.log("Serial port stopped")
                    serial.isOpen && serial.close();
                }
                if ("start" in data) {
                    console.log("Serial port started")
                    !serial.isOpen && serial.open()
                }
                if ("btnLed" in data && _id !== null) {
                    sendLedState(data.btnLed, serial, _id);
                }
            } catch (e) {
                console.log("error parsing socket message", e);
            }
        });
        return parser;
    } catch (error) {
        console.log(error)
        _socket.send(JSON.stringify({log: error}));
    }

}

export const handleESPData = function (raw, id) {
    // convert left / right from id to index
    try {
        let index = null;
        if (id === "left") index = 0;
        if (id === "right") index = 1;

        let data = JSON.parse(raw)
        if ("id" in data) {
            console.log("ID: ", data.id);
            return data.id;
        }

        if ("ButtonState" in data && index !== null) {
            let btnState = getButtonState(index, data.ButtonState);
            if (btnState === null) return;
            console.log("btnUpdate", index, data.ButtonState);
            // send button state to Unity
            _socket.send(JSON.stringify({button: btnState}));
        }
    } catch (e) {
        console.log("reading ESP data failed: ", e);
    }

}

const sendLedState = function (state, serial, index) {
    try {


        const id = state.id.toLowerCase();
        if (id === index) {
            try {
                serial.write(`${state.led.toUpperCase()}\r\n`);
                console.log("Turning LED", id, state.led.toUpperCase());
            } catch (e) {
                console.log("error writing to serial port", e);
            }

        }
    } catch (e) {
        console.log("error sending led state", e);

    }
}


export async function connectToEsp() {
    let ports = await serialport.SerialPort.list();
    ports.forEach((port) => {
        // check if the port is the ESP32
        if (!(port.vendorId === "10C4" && port.productId === "EA60")) return;
        console.log("ESP32 found on port: ", port.path);
        // create a new parser for the ESP32
        let parser = SerialSocket(port.path, 115200)
        let id = null;
        parser.on('data', (data) => {
            let res = handleESPData(data, id);
            if (res) {
                id = res;
            }
        });
    })
}