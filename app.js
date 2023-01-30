"use strict"
import express from "express";
import {createServer} from "http";
import {normalizePort, onError, onListening} from './bin/serverconfig.js';
import logger from 'morgan'
import createError from 'http-errors';
import dotenv from 'dotenv';
import {WebSocketServer} from 'ws'
import userNames from "./routes/userNames.js";
import database from "./routes/database.js";
import wsHandler from './bin/wsHandler.js';
import fs from "fs";

// create avatars folder if not exists
fs.mkdirSync('public/avatars', {recursive: true})

// region server
dotenv.config();

export const app = express();
export const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);
export const httpServer = createServer(app);
// add normal websocket support
export const wss = new WebSocketServer({server: httpServer});
// moved the wss in /bin/wsHandler.js
wsHandler()
//endregion

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