require('dotenv').config();

const portNumber = process.env.ESP1_PORT || 'COM3';
const baudRate = process.env.ESP1_BAUD || 115200;
const { SerialPort } = require('serialport')


const port = new SerialPort({ path: portNumber, baudRate: baudRate }, function (err) {
    if (err) {
        return console.log('Error: ', err.message)
    }
})


port.on('open', () => {
    console.log('Serial port open');
});

port.on('data', (data) => {
    console.log('Data:', data);
});

