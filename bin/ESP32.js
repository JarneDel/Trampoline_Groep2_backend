import {SerialPort} from 'serialport';
import {ReadlineParser} from '@serialport/parser-readline';
import {updateBtn} from "./button.js";
import {MaxJumpForce} from "../config.js";
import {isJumping, MPU_Since_last_jump} from "../Globals.js";

const getSerialPort = function (portNumber, baudRate, socket) {
    try {
        baudRate = Number(baudRate) || 115200;
        return new SerialPort({path: portNumber, baudRate: baudRate}, function (err) {
            if (err) {
                return console.log('Error: ', err.message)
            }
        });
    } catch (e) {
        socket.send(JSON.stringify({log:  e.message}));
    }
}

export const SerialSocket = function (socket, portNumber, baudRate) {
    try {
        console.info('SerialSocket: ', portNumber, baudRate);
        const serial = getSerialPort(portNumber, baudRate, socket);
        const parser = serial.pipe(new ReadlineParser({delimiter: '\r\n'}));
        serial.on('open', function () {
            console.log('Serial port connected');
        });

        // ...
        socket.on('close', (reason) => {
            console.log("Connection closed: ", reason);
            serial.isOpen && serial.close();
        });
        socket.on('message', function (msg) {
            if (msg.data.stop) {
                serial.isOpen && serial.close();
            }
            if (msg.data.start) {
                !serial.isOpen && serial.close()
            }
        });
        return parser;
    } catch (error) {
        console.log(error)
        socket.send(JSON.stringify({log: error}));
    }

}

export const handleData = function (raw, index, socket){
    let data = JSON.parse(raw)
    if(data.ButtonState !== undefined){
        let btnState = updateBtn(index, data.ButtonState)
        console.log(btnState)
        if (btnState !== null){
            socket.send(JSON.stringify(btnState))
        }
    }
    if(data.JumpForce !== undefined){
        let jumpForce = MaxJumpForce - data.JumpForce;
        if(isJumping){
            MPU_Since_last_jump.push({
                force: jumpForce,
                timestamp: new Date()
            })
        }
        else if (MPU_Since_last_jump.length > 0){
            const max = Math.max(...MPU_Since_last_jump);
            MPU_Since_last_jump = [];
            socket.send(JSON.stringify({accel: max}))
        }
        socket.send(JSON.stringify(jumpForce))
    }

}
