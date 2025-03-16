#!/usr/bin/env node
import { open } from "node:fs/promises";
import WebSocket, { WebSocketServer } from "ws";

import readUntilLengthReach from "./read-until.js";

const ONERNG_CHUNK = 4000; // In bytes, so 32000 bits per trial
const ONERNG_PATH = process.env.ONERNG_PATH || "/dev/urandom"; // '/dev/ttyACM0';
const APP_ENV = process.env.APP_ENV || "dev";

let rngFd = 0;
let wsConnection = null;
let xpStarted = false;

const wss = new WebSocketServer({
  port: 8080,
  verifyClient: () => wsConnection === null,
});

console.log(`Server started at localhost:8080 in ${APP_ENV} environment`);

async function sendXpData(buffer) {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    wsConnection.send(buffer, (err) => {
      if (err) {
        console.error("Error sending data:", err);
      }
    });
  }
}

async function readAndSendBytes() {
  try {
    const buffer = await readUntilLengthReach(rngFd, ONERNG_CHUNK);
    await sendXpData(buffer);

    if (APP_ENV === "dev") {
      setTimeout(readAndSendBytes, 100);
    } else {
      setTimeout(readAndSendBytes, 1);
    }
  } catch (err) {
    console.error("Error reading bytes:", err);
    setTimeout(readAndSendBytes, 1000);
  }
}

// On startup, try to read from OneRNG device
open(ONERNG_PATH, "r")
  .then((fd) => {
    console.log("Connected to the random number generator");
    rngFd = fd;
    readAndSendBytes();
  })
  .catch((err) => {
    console.error("Error opening OneRNG device:", err.message);
    if (err.code === "EACCES") {
      console.error("You should be root to access OneRNG stream.");
    }
  });

wss.on("connection", (ws) => {
  console.log("Client connection.");
  wsConnection = ws;
  xpStarted = false;
  readAndSendBytes();

  ws.on("message", (msg) => {
    if (msg === "start") {
      console.log("Client start XP. Start collecting numbers.");
      xpStarted = true;
    }
  });

  ws.on("close", () => {
    console.log("Connection closed.");
    wsConnection = null;
  });
});
