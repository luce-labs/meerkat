//!/usr/bin/env ts-node

import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import { parseInt as parseNumber } from "lib0/number";
import { setupWSConnection } from "./utils";

const host: string = process.env.HOST || "0.0.0.0";
const port: number = parseNumber(process.env.PORT || "8080");

const wss = new WebSocketServer({ noServer: true });

const server = http.createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("okay");
});

wss.on("connection", setupWSConnection);

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
    wss.emit("connection", ws, request);
  });
});

server.listen(port, host, () => {
  console.log(`Running at '${host}' on port ${port}`);
});
