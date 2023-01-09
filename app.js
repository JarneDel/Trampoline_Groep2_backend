import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {normalizePort, onError, onListening} from './bin/serverconfig.js';
import logger from 'morgan'
import createError from 'http-errors';
import {SerialSocket} from './bin/ESP32.js';
import dotenv from 'dotenv';
dotenv.config();

export const app = express();
export const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
export const httpServer = createServer(app);
export const io = new Server(httpServer, { /* options */ });

io.on("connection", (socket) => {
  console.log("Connection established");
  const parser = SerialSocket(socket, process.env.ESP1_PORT, process.env.ESP1_BAUD);
  parser.on('data', function (data) {
    console.log('Data:', data);
    socket.emit('data', data);
  });
});



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get('/', (req, res) => {
  res.json('Hello World!');
});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

httpServer.listen(3000);
httpServer.on('error', onError);
httpServer.on('listening', onListening);
