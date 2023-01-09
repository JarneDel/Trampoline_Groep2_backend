import {SerialPort} from 'serialport';
import {ReadlineParser} from '@serialport/parser-readline';

const getSerialPort = function (portNumber, baudRate) {
    baudRate = Number(baudRate) || 115200;
    return new SerialPort({path: portNumber, baudRate: baudRate}, function (err) {
        if (err) {
            return console.log('Error: ', err.message)
        }
    });

}

export const SerialSocket = function (socket, portNumber, baudRate) {
    try {
        console.info('SerialSocket: ', portNumber, baudRate);
        const serial = getSerialPort(portNumber, baudRate);
        const parser = serial.pipe(new ReadlineParser({delimiter: '\r\n'}));
        serial.on('open', function () {
            console.log('Serial port connected');
        });

        // ...
        socket.on("disconnect", (reason) => {
            console.log("Connection closed: ", reason);
            serial.isOpen && serial.close();
        });
        socket.on("reconnect", () => {
            console.log("Reconnected");
            !serial.isOpen && serial.open();
        });
        socket.on('stop', function () {
            serial.isOpen && serial.close();
        });
        socket.on('start', function () {
            !serial.isOpen && serial.open();
        });
        return parser;
    }
    catch (error) {
        console.log(error)
    }

}


