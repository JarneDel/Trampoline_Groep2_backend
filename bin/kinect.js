import Kinect2 from "kinect2";
import {sensitivityKinectJump} from "../config.js";
import {_socket} from "./wsHandler.js";


// region variables

let isCalibrating = false;
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


const calibrate =  (bodyFrame) => {
    if (isCalibrating) {
        const cameraY = bodyFrame.bodies.map((body) => {
            if (!body.tracked) return 0;
            return body.joints[Kinect2.JointType.spineMid].cameraX
        })
        // check if player is on left or right side of the screen
        // remove player from list if he is not tracked
        let calibratingPlayer = []
        const cameraYTracked = cameraY.filter((y) => y !== 0)
        if (cameraYTracked.length !== 0 && cameraYTracked.length < 3) {
            const meanY = cameraYTracked.reduce((a, b) => a + b) / cameraYTracked.length
            const left = cameraYTracked.filter((y) => y < meanY)
            const right = cameraYTracked.filter((y) => y > meanY)
            const middle = cameraYTracked.filter((y) => y === meanY)
            console.log(right - left < 0.1 ? null : right - left)
            if (right - left < 0.5) {
                _socket.send(JSON.stringify({
                    type: "kinect",
                    data: {
                        type: "calibration",
                        data: {
                            type: "distance",
                            value: -1
                        }
                    }
                }))
                console.log("distance to small")
            }
            // find index of player on the left side of the screen
            const leftIndex = cameraY.indexOf(left[0])
            // find index of player on the right side of the screen
            const rightIndex = cameraY.indexOf(right[0])
            // find middle player index
            const middleIndex = cameraY.indexOf(middle[0])
            if (leftIndex !== -1 && rightIndex !== -1) {
                _socket.send(JSON.stringify({
                    type: "kinect",
                    data: {
                        type: "calibration",
                        data: {
                            leftIndex: leftIndex,
                            rightIndex: rightIndex,
                            middleIndex: middleIndex
                        }
                    }
                }))
                console.log("calibration done")
            } else if (middleIndex !== -1) {
                _socket.send(JSON.stringify({
                    type: "kinect",
                    data: {
                        type: "calibration",
                        data: {
                            middleIndex: middleIndex,
                            leftIndex: leftIndex,
                            rightIndex: rightIndex
                        }
                    }
                }))
            }
            console.log(leftIndex, rightIndex, middleIndex)
        }
        else{
            _socket.send(JSON.stringify({
                type: "kinect",
                data: {
                    type: "calibration",
                    data: {
                        type: "players",
                        value: cameraYTracked.length
                    }
                }
            }))
        }
    }
}


export async function handleKinectBodyFrame(bodyFrame) {
    calibrate(bodyFrame);
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
            break;
        case 'FINISHED':
            console.log('Stop calibration')
            isCalibrating = false;
    }
}
