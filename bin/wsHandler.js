import {connectToEsp} from './ESP32.js';
import * as kinect2 from './kinect.js';
import {wss} from '../app.js';


export default function () {
    wss.on("connection", websocketConnection)
}

export let _socket;

// variables

async function websocketConnection(socket) {

    // region Variables

    // endregion
    // check if there is already a connection
    if (wss.clients.size > 1) {
        socket.send(JSON.stringify({log: "There is already a connection"}));
        console.log("A client tried to connect but there is already a connection");
        socket.close();
        return;
    }


    console.log('Connection established');
    _socket = socket;
    // region state-management


    // endregion
    // region esp32
    connectToEsp()
        .then(() => {
            console.info("connections with esp established");
        }).catch((e) => {
            console.error("error connecting to esp", e);
        });

    // endregion

    const kinect = kinect2.getKinectConnection();
    socket.on('close', async () => {
        console.log("connection closed")
        kinect2.resetKinect();
        await kinect.close();
        _socket = null;
    });


    socket.on('message', socketMessageHandler);

    kinect.on('bodyFrame', kinect2.handleKinectBodyFrame)

}


function socketMessageHandler(msg){
    try {
        let data = JSON.parse(msg)
        console.info(data)

        // check kinect reset
        if ('resetKinect' in data) {
            kinect2.resetKinect();
            return;
        }

        if ('status' in data) kinect2.calibration(data);
    } catch (e) {
        console.error("error parsing socket message", e);
    }
}