import express from "express";

import {createServer} from "http";
import {normalizePort, onError, onListening} from './bin/serverconfig.js';
import logger from 'morgan'
import createError from 'http-errors';
import {handleData, SerialSocket} from './bin/ESP32.js';
import dotenv from 'dotenv';
import {getKinectConnection, getMaxPercentage} from "./bin/kinect.js";
import fs from 'fs';
import {WebSocketServer} from 'ws'
import {sensitivityKinectJump} from "./config.js";
import Kinect2 from "kinect2";
import userNames from "./routes/userNames.js";
import database from "./routes/database.js";

dotenv.config();

export const app = express();
export const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);
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

    let movingAverageList, jumpList, jumpMaxList = [[], [], [], [], [], []];
    let isJumpingList, jumpLength = []
    let OnlyOneStart, mean = [0, 0, 0, 0, 0, 0]

    const kinect = getKinectConnection();
    socket.on('close', async () => {
        await kinect.close();
        connectionCount -= 1;
        console.log(jumpMaxList);
    });


    kinect.on('bodyFrame', function (bodyFrame) {

        for (let i = 0; i < bodyFrame.bodies.length; i++) {
            if (bodyFrame.bodies[i].tracked) {
                console.log('new bodyframe')
                const y = bodyFrame.bodies[i].joints[Kinect2.JointType.spineBase].cameraY + 1;
                const joint = bodyFrame.bodies[i].joints[Kinect2.JointType.spineBase];

                if (movingAverageList[i].length < 500) {
                    movingAverageList[i].push(y)

                } else {
                    movingAverageList[i].shift()
                    movingAverageList[i].push(y);
                }
                mean[i] = movingAverageList[i].reduce((a, b) => a + b) / movingAverageList[i].length;


                if (y > mean[i] * (1 + sensitivityKinectJump)) {
                    isJumpingList[i] = true;
                    console.info("moving up")
                    jumpList[i].push(y)

                } else if (isJumpingList[i] && y < mean[i] * (1 + sensitivityKinectJump / .7)) {
                    console.warn("jump detected: player", i)
                    jumpMaxList[i].push(Math.max(...jumpList[i]));
                    let {value, max, min} = getMaxPercentage(Math.max(...jumpList[i]), minJumpStrength[i], maxJumpStrength[i])
                    minJumpStrength[i] = min;
                    maxJumpStrength[i] = max;
                    socket.send(JSON.stringify({
                        jump: {
                            force: 'value',
                            player: i
                        }
                    }));
                    jumpList[i] = [];
                    isJumpingList[i] = false;
                    OnlyOneStart[i] = false;
                    jumpLength[i] = undefined
                }
                if (!OnlyOneStart[i] && isJumpingList[i]) {
                    console.log("jump started player", i);
                    socket.send(JSON.stringify({
                        isJumping: {
                            index: i,
                            status: 'start'
                        }
                    }))
                    jumpLength[i] = new Date();
                    OnlyOneStart[i] = true;
                }
                if (jumpLength[i] && new Date() - jumpLength[i] > 5000) {
                    console.log("jump timed out");
                    jumpList[i] = [];
                    isJumpingList[i] = false;
                    OnlyOneStart[i] = false;
                    jumpLength[i] = undefined
                }
                fs.appendFile(`log/body${i}.csv`, `${joint.cameraX}, ${y}, ${joint.cameraZ},${joint.colorX}, ${joint.colorY}, ${joint.depthX}, ${joint.depthY}, ${mean[i]}\n`, () => {

                });
            }

        }

    });
});


app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get("/", (req, res) => {
    res.json("Hello World!");
});

app.use('/username', userNames)
app.use('/scoreboard', database)
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

httpServer.listen(3000);
httpServer.on("error", onError);
httpServer.on("listening", onListening);
