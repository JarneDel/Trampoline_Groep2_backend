import {handleData, SerialSocket} from "./ESP32.js";
import {getKinectConnection} from "./kinect.js";
import Kinect2 from "kinect2";
import {sensitivityKinectJump} from "../config.js";
import fs from "fs";
import {wss} from "../app.js";

wss.on("connection", (socket) => {
    console.log("Connection established");
    // region state-management
    let isCalibrating = false;
    let calibrationPause = false;
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
        console.info(data)
        if (!("status" in data)) return
        console.log("calibration toggle for player", data.player)
        switch (data.status) {
            case "STARTED":
                console.log("Start calibration")
                isCalibrating = true;
                console.log(data.player, "is calibrating")
                calibratingPlayer = data.player ? 0 : 1
                break;
            case "PAUSED":
                console.log("Pause calibration")
                isCalibrating = false;
                calibrationPause = true;
                break;
            case "RESUMED":
                console.log("Resume calibration")
                isCalibrating = true;
                calibrationPause = false;
                break;
            case "SWITCH_PLAYER":
                console.log("Switch player")
                calibratingPlayer = data.player ? 0 : 1
                break;
            default:
                isCalibrating = false;
                calibrationPause = false;
                console.log("calibration finished, ", calibratedIndices)
                socket.send(JSON.stringify({
                    calibrationSuccess: {
                        indices: calibratedIndices
                    }
                }))
                break;
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
                }
                ``
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
                    if (!isCalibrating && !calibrationPause) {
                        let player;
                        if (calibratedIndices.includes(i)) {
                            calibratedIndices.forEach((val, j) => {
                                if (val === i) {
                                    player = j;
                                }
                            })
                        }
                        if (!player) player = i;
                        console.warn("jump detected: player", player);
                        socket.send(JSON.stringify({
                            jump: {
                                force: jumpPercentage, player: player
                            }
                        }));
                    } else if (isCalibrating && !calibrationPause) {
                        if (i !== calibratedIndices[calibratingPlayer]) console.info("calibration player changed");
                        socket.send(JSON.stringify({
                            calibrationJumpDetected: {
                                kinectIndex: i, playerIndex: calibratingPlayer
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
                            index: i, status: 'start'
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