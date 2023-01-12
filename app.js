import express from "express";
import {createServer} from "http";
import {normalizePort, onError, onListening} from './bin/serverconfig.js';
import logger from 'morgan'
import createError from 'http-errors';
import {handleData, SerialSocket} from './bin/ESP32.js';
import dotenv from 'dotenv';
import {getKinectConnection} from "./bin/kinect.js";
import fs from 'fs';
import {WebSocketServer} from 'ws'
import {sensitivityKinectJump} from "./config.js";

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
    if (connectionCount > 1) {

    }
    const parser = SerialSocket(socket, process.env.ESP1_PORT, process.env.ESP1_BAUD);
    parser.on('data', function (raw) {
        handleData(raw, 0, socket)


    });
    const parser2 = SerialSocket(socket, process.env.ESP2_PORT, process.env.ESP2_BAUD);
    parser2.on('data', function (data) {
        handleData(data, 1, socket)
    });

    let movingAverageList = [];
    let jumpList = [[],[],[],[],[],[]];
    let jumpMaxList = [[],[],[],[],[],[]];
    let isJumping = false;
    let mean = 0;
    const kinect = getKinectConnection();
    socket.on('close', async () => {
        await kinect.close();
        connectionCount -= 1;
        console.log(jumpMaxList);
    });

    kinect.on('bodyFrame', function (bodyFrame) {
        for (let i = 0; i < bodyFrame.bodies.length; i++) {
            if (bodyFrame.bodies[i].tracked) {
                let y = bodyFrame.bodies[i].joints[0].cameraY + 1;
                if (this.cameraYmin === undefined) {
                    this.cameraYmin = y
                    this.cameraYmax = y
                }
                const spineShoulder = bodyFrame.bodies[i].joints[0];
                // console.log(spineShoulder);
                if (y < this.cameraYmin) this.cameraYmin = y;
                if (spineShoulder.cameraY > this.cameraYmax) this.cameraYmax = spineShoulder.cameraY;

                if (movingAverageList.length < 500) {
                    movingAverageList.push(y)
                    console.log("add")

                } else {
                    movingAverageList.shift()
                    movingAverageList.push(y);
                    console.log('remove')
                }
                mean = movingAverageList.reduce((a, b) => a + b) / movingAverageList.length;
                console.log(mean, "gemiddelde, len", movingAverageList.length)
                if ( y < mean * (1 - sensitivityKinectJump)){
                    console.log("Moving down")
                    // socket.send(JSON.stringify("kinectDown"))
                }
                if ( y > mean * (1 + sensitivityKinectJump) ){
                    isJumping = true;
                    console.warn("moving up")
                    jumpList[i].push(y)

                }
                else if (isJumping && y < mean * ( 1 + sensitivityKinectJump / .7)){
                    jumpMaxList[i].push(Math.max(...jumpList[i]));
                    socket.send(JSON.stringify({
                        jump: Math.max(...jumpList[i]),
                        player: i
                    }));
                    jumpList[i] = [];
                    isJumping = false;
                }
                fs.appendFile(`log/body${i}.csv`, `${spineShoulder.cameraX}, ${y}, ${spineShoulder.cameraZ},${spineShoulder.colorX}, ${spineShoulder.colorY}, ${spineShoulder.depthX}, ${spineShoulder.depthY}\n`, err => {
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
