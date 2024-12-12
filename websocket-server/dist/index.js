"use strict";
//!/usr/bin/env ts-node
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const number_1 = require("lib0/number");
const utils_1 = require("./utils");
const host = process.env.HOST || "localhost";
const port = (0, number_1.parseInt)(process.env.PORT || "1234");
const wss = new ws_1.WebSocketServer({ noServer: true });
const server = http_1.default.createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("okay");
});
wss.on("connection", utils_1.setupWSConnection);
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});
server.listen(port, host, () => {
    console.log(`Running at '${host}' on port ${port}`);
});
