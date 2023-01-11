import express from "express";
import {createServer} from "http";
import {normalizePort, onError, onListening} from './bin/serverconfig.js';
import logger from 'morgan'
import createError from 'http-errors';
import {SerialSocket} from './bin/ESP32.js';
import dotenv from 'dotenv';
import {getKinectConnection} from "./bin/kinect.js";
import fs from 'fs';
import {WebSocketServer } from 'ws'

dotenv.config();

export const app = express();
export const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
export const httpServer = createServer(app);
// add normal websocket support
export const wss = new WebSocketServer({server: httpServer});

let connectionCount = 0;

wss.on("connection", (socket) => {
    console.log("Connection established");
    connectionCount += 1;
    if(connectionCount > 1){

    }
    const parser = SerialSocket(socket, process.env.ESP1_PORT, process.env.ESP1_BAUD);
    parser.on('data', function (data) {
        console.log('Data:', data);
        fs.appendFile('log/esp1.txt', JSON.stringify(data), (e)=>{
            console.warn(e)
        })
        socket.send(JSON.stringify({data: data}));
    });
    const parser2 = SerialSocket(socket, process.env.ESP2_PORT, process.env.ESP2_BAUD);
    parser2.on('data', function (data) {
        console.log('Data2:', data);
        fs.appendFile('log/esp2.txt', JSON.stringify(data), (e)=>{
            console.warn(e)
        })
        socket.send(JSON.stringify({data2: data}));
    });

    const kinect = getKinectConnection();
    socket.on('close', async () => {
        await kinect.close();
        connectionCount -=1;

    })
    kinect.on('bodyFrame', function (bodyFrame) {
        for (let i = 0; i < bodyFrame.bodies.length; i++) {
            if (bodyFrame.bodies[i].tracked) {
                if (this.colorYmin === undefined) {
                    this.colorYmin = bodyFrame.bodies[i].joints[0].colorY;
                    this.colorYmax = bodyFrame.bodies[i].joints[0].colorY;
                }
                const spineShoulder = bodyFrame.bodies[i].joints[0];
                // console.log(spineShoulder);
                if (spineShoulder.colorY < this.colorYmin) {
                    this.colorYmin = spineShoulder.colorY
                }
                if (spineShoulder.colorY > this.colorYmax) {
                    this.colorYmax = spineShoulder.colorY
                }
                const diff = this.prevColorY - spineShoulder.colorY;
                this.prevColorY = spineShoulder.colorY;
                let msg = {min: this.colorYmin, max: this.colorYmax, diff: diff, shoulder: spineShoulder,};
                socket.send(JSON.stringify({kinect: msg}));
                fs.appendFile(`log/body${i}.csv`, `${spineShoulder.cameraX}, ${spineShoulder.cameraY}, ${spineShoulder.cameraZ},${spineShoulder.colorX}, ${spineShoulder.colorY}, ${spineShoulder.depthX}, ${spineShoulder.depthY}\n`, err => {
                    console.log(err);
                });
            }
        }
    });
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.get('/', (req, res) => {
    res.json('Hello World!');
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

httpServer.listen(3000);
httpServer.on('error', onError);
httpServer.on('listening', onListening);
