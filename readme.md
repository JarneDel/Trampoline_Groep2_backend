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
  "jump": "float",   // coordinate of highest point
  "player": "int"   // player index
}
```

### Username Generation
URL: `http://localhost:3000/username`    
Content-type: application/json  
response-example: `"LonelyHat"`  

