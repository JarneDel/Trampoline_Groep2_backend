# team project trampoline groep 2

## Websocket data
### button
both buttons pressed:    
`{btn: 'both'}`  
player1 pressed:  
`{btn: 'p1'}`  
player2 pressed   
`{btn: 'p2'}`

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
URL: `http://localhost:3000/username/avatar`  
Content-type: HTML  
response-example: svg  


