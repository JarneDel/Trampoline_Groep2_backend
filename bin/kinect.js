import Kinect2 from "kinect2";


export function getKinectConnection(){
    const kinect = new Kinect2();
    if (kinect.open()) {
        console.log("Kinect2 connected");
        kinect.openBodyReader();
        return kinect;
    } else {
        console.log("Kinect2 not connected");
    }
}

export function getKinectData(kinect){

}

export function closeKinectConnection(kinect){
    kinect.close();
}

export function getMaxPercentage(val, min, max){
    if (val > max) max = val;
    if (val < min) min =val;
    let value = ((val - min)) / (max - min)
    return {
        value: value,
        max: max,
        min: min,
    }
}

