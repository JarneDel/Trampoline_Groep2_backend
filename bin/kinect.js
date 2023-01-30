import Kinect2 from "kinect2";
import {sensitivityKinectJump} from "../config.js";
import {_socket} from "./wsHandler.js";


// region variables

let isCalibrating = false;
let calibrationPause = false;
let calibratingPlayer = -1;
let calibratedIndices = []

let movingAverageList = [[], [], [], [], [], []]
let jumpList = [[], [], [], [], [], []]
let isJumpingList = [];
let jumpLength = []
let OnlyOneStart = [0, 0, 0, 0, 0, 0]
let mean = [0, 0, 0, 0, 0, 0]
let highestJump = [0, 0, 0, 0, 0, 0];
let lowestJump = [5, 5, 5, 5, 5, 5];

// endregion

export function resetKinect() {
    movingAverageList = [[], [], [], [], [], []]
    jumpList = [[], [], [], [], [], []]
    isJumpingList = [];
    jumpLength = []
    OnlyOneStart = [0, 0, 0, 0, 0, 0]
    mean = [0, 0, 0, 0, 0, 0]
    highestJump = [0, 0, 0, 0, 0, 0];
    lowestJump = [5, 5, 5, 5, 5, 5];
}

export function getKinectConnection() {
    const kinect = new Kinect2();
    if (kinect.open()) {
        console.log("Kinect2 connected");
        kinect.openBodyReader();
        return kinect;
    } else {
        console.log("Kinect2 not connected");
    }
}

export async function handleKinectBodyFrame(bodyFrame) {
    for (let i = 0; i < bodyFrame.bodies.length; i++) {
        // check if a body is tracked
        if (!bodyFrame.bodies[i].tracked) continue;
        const y = bodyFrame.bodies[i].joints[Kinect2.JointType.spineMid].cameraY + 1;
        // moving average list for setting a baseline for the jump-detector
        if (movingAverageList[i].length < 500) {
            movingAverageList[i].push(y)
        } else {
            movingAverageList[i].shift()
            movingAverageList[i].push(y);
        }
        // average, is the baseline of the jump detector
        mean[i] = movingAverageList[i].reduce((a, b) => a + b) / movingAverageList[i].length;
        if (y > mean[i] * (1 + sensitivityKinectJump)) {
            // move up
            isJumpingList[i] = true;
            jumpList[i].push(y)
        }
        // check if jump is over
        else if (isJumpingList[i] && y < mean[i] * (1 + sensitivityKinectJump / .8)) {
            // end of jump
            let top = Math.max(...jumpList[i]);
            if (top > highestJump[i]) highestJump[i] = top;
            if (top < lowestJump[i]) lowestJump[i] = top;
            let jumpPercentage = ((top - lowestJump[i])) / (highestJump[i] - lowestJump[i])
            if (isNaN(jumpPercentage)) jumpPercentage = 1;
            if (!isCalibrating && !calibrationPause) {
                console.warn('jump detected: player', i);
                _socket.send(JSON.stringify({
                    jump: {
                        force: jumpPercentage, player: i
                    }
                }));
            } else if (isCalibrating && !calibrationPause) {
                if (i !== calibratedIndices[calibratingPlayer]) console.info('calibration player changed');
                _socket.send(JSON.stringify({
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
            console.log('jump started player', i);
            _socket.send(JSON.stringify({
                isJumping: {
                    index: i, status: 'start'
                }
            }))
            jumpLength[i] = new Date();
            OnlyOneStart[i] = true;
        }
        if (jumpLength[i] && new Date() - jumpLength[i] > 5000) {
            // jump timeout, not working correctly
            console.log('jump timed out');
            jumpList[i] = [];
            isJumpingList[i] = false;
            OnlyOneStart[i] = false;
            jumpLength[i] = undefined
        }

    }
}
export function calibration(data){
    switch (data.status) {
        case 'STARTED':
            console.log('Start calibration')
            isCalibrating = true;
            console.log(data.player, 'is calibrating')
            calibratingPlayer = data.player
            break;
        case 'PAUSED':
            console.log('Pause calibration')
            isCalibrating = false;
            calibrationPause = true;
            break;
        case 'RESUMED':
            console.log('Resume calibration')
            isCalibrating = true;
            calibrationPause = false;
            break;
        case 'SWITCH_PLAYER':
            console.log('Switch player')
            calibratingPlayer = data.player
            break;
        default:
            isCalibrating = false;
            calibrationPause = false;
            console.log('calibration finished, ',  calibratedIndices)
            _socket.send(JSON.stringify({
                calibrationSuccess: {
                    indices:  calibratedIndices
                }
            }))
            break;
    }
}