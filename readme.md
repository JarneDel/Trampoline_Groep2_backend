# team project trampoline groep 2

## installation
download node.js: https://nodejs.org/en/download/ 
download installation script: https://raw.githubusercontent.com/JarneDel/Trampoline_Groep2_backend/main/install.bat
run the batch file


## Websocket data
### button
index 0: button left  
index 1: button right  
index 2: both buttons  
```json
{
    "button": {
        "btn": [false, false, false]
    }
}
```

### kinect
```json
{
  "jump": "float",   // coordinat   e of highest point
  "player": "int"   // player index
}
```

#### send calibration events
```js
calibration: {
    "status": "calibrating" | "finished",
    "player": "p1" | "p2"
}
```

end of calibration
```js
calibrationSuccess: {
    "indices": [i1, i2]
}
```

    calibrationJumpDetected : {
        kinectIndex: i,
        playerIndex: calibratingPlayer
    }



### Username Generation
URL: `http://localhost:3000/username`    
Content-type: application/json  
response-example: `"LonelyHat"`  

### avatar Generation

response: .png image

```http request

POST http://localhost:3000/username/avatar
Content-Type: application/json

{
"id": {{id}}
}

### get avatar

GET http://localhost:3000/username/avatar/{{id}}
Content-Type: application/json


```
