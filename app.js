"use strict"
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
import Kinect2 from "kinect2";
import userNames from "./routes/userNames.js";
import database from "./routes/database.js";

// region server
dotenv.config();

export const app = express();
export const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);
export const httpServer = createServer(app);
// add normal websocket support
export const wss = new WebSocketServer({server: httpServer});
//endregion

wss.on("connection", (socket) => {
    console.log("Connection established");
    // region state-management
    let isCalibrating = false;
    let calibratingPlayer = -1;
    let calibratedIndices = []
    let movingAverageList = [[], [], [], [], [], []]
    let jumpList = [[], [], [], [], [], []]
    let jumpMaxList = [[], [], [], [], [], []];
    let isJumpingList = [];
    let jumpLength = []
    let OnlyOneStart = [0, 0, 0, 0, 0, 0]
    let mean = [0, 0, 0, 0, 0, 0]
    let highestJump = [0, 0, 0, 0, 0, 0];
    let lowestJump = [5, 5, 5, 5, 5, 5]

    // endregion
    // region esp32
    const parser = SerialSocket(socket, process.env.ESP1_PORT, process.env.ESP1_BAUD);
    parser.on('data', function (raw) {
        handleData(raw, 0, socket)
    });
    const parser2 = SerialSocket(socket, process.env.ESP2_PORT, process.env.ESP2_BAUD);
    parser2.on('data', function (data) {
        handleData(data, 1, socket)
    });
    // endregion

    const kinect = getKinectConnection();
    socket.on('close', async () => {
        await kinect.close();
        console.log(jumpMaxList);
    });
    socket.on('message', (msg) => {
        let data = JSON.parse(msg)
        console.log(data)
        if ("status" in data) {
            console.log("calibration toggle for player", data.player)
            let calibration = data;
            if (calibration.status === "STARTED") {
                console.log("Start calib")
                isCalibrating = true;
                calibratingPlayer = calibration.player ? 0 : 1
            } else {
                isCalibrating = false;
                console.log("calibration finished, ", calibratedIndices)
                socket.send(JSON.stringify({
                    calibrationSuccess: {
                        indices: calibratedIndices
                    }
                }))
            }
        }
    })


    kinect.on('bodyFrame', function (bodyFrame) {

        for (let i = 0; i < bodyFrame.bodies.length; i++) {
            if (bodyFrame.bodies[i].tracked) {
                // region jumpDetection
                const y = bodyFrame.bodies[i].joints[Kinect2.JointType.spineBase].cameraY + 1;
                const joint = bodyFrame.bodies[i].joints[Kinect2.JointType.spineBase];
                if (movingAverageList[i].length < 500) {
                    movingAverageList[i].push(y)
                } else {
                    movingAverageList[i].shift()
                    movingAverageList[i].push(y);
                }``
                mean[i] = movingAverageList[i].reduce((a, b) => a + b) / movingAverageList[i].length;
                if (y > mean[i] * (1 + sensitivityKinectJump)) {
                    // move up
                    isJumpingList[i] = true;
                    jumpList[i].push(y)

                } else if (isJumpingList[i] && y < mean[i] * (1 + sensitivityKinectJump / .8)) {
                    // end of jump
                    let top = Math.max(...jumpList[i]);
                    jumpMaxList[i].push(top);
                    if (top > highestJump[i]) highestJump[i] = top;
                    if (top < lowestJump[i]) lowestJump[i] = top;
                    let jumpPercentage = ((top - lowestJump[i])) / (highestJump[i] - lowestJump[i])
                    if (isNaN(jumpPercentage)) jumpPercentage = 1;
                    if (!isCalibrating) {
                        let player;
                        if(calibratedIndices.includes(i)){
                            calibratedIndices.forEach((val, j)=>{
                                if (val === i){
                                    player = j;
                                }
                            })
                        }
                        if (!player) player = i;
                        console.warn("jump detected: player", player);
                        socket.send(JSON.stringify({
                            jump: {
                                force: jumpPercentage,
                                player: player
                            }
                        }));
                    } else {
                        if (calibratedIndices[calibratingPlayer] !== i) console.info("calibration player changed");
                        socket.send(JSON.stringify({
                            calibrationJumpDetected : {
                                kinectIndex: i,
                                playerIndex: calibratingPlayer
                            }
                        }))
                        calibratedIndices[calibratingPlayer] = i;
                    }
                    jumpList[i] = [];
                    isJumpingList[i] = false;
                    OnlyOneStart[i] = false;
                    jumpLength[i] = undefined
                }
                if (!OnlyOneStart[i] && isJumpingList[i]) {
                    // start jump
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
                    // jump timeout, not working correctly
                    console.log("jump timed out");
                    jumpList[i] = [];
                    isJumpingList[i] = false;
                    OnlyOneStart[i] = false;
                    jumpLength[i] = undefined
                }
                //endregion
                //region logging
                fs.appendFile(`log/body${i}.csv`, `${joint.cameraX}, ${y}, ${joint.cameraZ},${joint.colorX}, ${joint.colorY}, ${joint.depthX}, ${joint.depthY}, ${mean[i]}\n`, () => {

                });
                // endregion
            }

        }

    });
});

// region routes and server
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
// endregion