#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");

const readUntilLengthReach = require("./read-until");

const CHICKENRAND_URL = process.env.CHICKENRAND_URL || "localhost";
const CHICKENRAND_PORT = process.env.CHICKENRAND_PORT || "7000";
const ONERNG_CHUNK = 4000; // In byte, so 32000 bits per trials
const ONERNG_PATH = process.env.ONERNG_PATH || "/dev/urandom"; //'/dev/ttyACM0';
const XP_TRIALS_COUNT = 100;
const APP_ENV = process.env.APP_ENV || "dev";

let rngFd = 0;
let wsConnection = null;
// We store all the XP data into a buffer array and then send them at the end
let xpStarted = false;

const wss = new WebSocket.Server({
  port: 8080,
  // Allow only one connection at a time
  verifyClient: () => wsConnection === null
});

console.log("Server started at localhost:8080 in " + APP_ENV + " environment ");

function sendXpData(buffer) {
  return new Promise((resolve, reject) => {
    wsConnection.send(buffer, function(err) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function readAndSendBytes() {
  const bytesToRead = ONERNG_CHUNK;

  try {
    readUntilLengthReach(rngFd, bytesToRead).then(buffer => {
      if (
        wsConnection !== null &&
        wsConnection.readyState === WebSocket.OPEN &&
        xpStarted
      ) {
        // Start reading again only after sending all the datas
        sendXpData(buffer)
          .then(() => {
            if (APP_ENV === "dev") {
              setTimeout(readAndSendBytes, 100);
            } else {
              setTimeout(readAndSendBytes, 1);
            }
          })
          .catch(err => console.error(err));
      } else if (
        wsConnection !== null &&
        wsConnection.readyState === WebSocket.OPEN
      ) {
        setTimeout(readAndSendBytes, 1);
      }
    });
  } catch (err) {
    console.error(err, typeof err);
  }
}
// On start up, try to read from oneRng device
fs.open(ONERNG_PATH, "r", function(status, fd) {
  if (status) {
    console.error(status.message);
    if (status.code === "EACCES") {
      console.error("You should be root to access OneRNG stream.");
      throw new Error("You should be root to access OneRNG stream.");
    }
    return;
  }
  console.log("Connected to the random number generator");
  rngFd = fd;
});

// inspired from https://stackoverflow.com/a/45178696/947242
function uploadRawData(dataBuffer, userXpId) {
  return new Promise((resolve, reject) => {
    let options = {
      method: "POST",
      hostname: CHICKENRAND_URL,
      port: CHICKENRAND_PORT,
      path: `/xp/send_raw_data/${userXpId}`,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": dataBuffer.length
      }
    };
    let data = [];
    let request = http.request(options);
    request.on("error", err => reject(err));

    request.write(dataBuffer);
    request.end(null, null, () => resolve());
  });
}

wss.on("connection", function connection(ws) {
  console.log("Client connection.");
  wsConnection = ws;
  xpStarted = false;
  readAndSendBytes();
  // User started the experiment
  ws.on("message", function(msg) {
    if (msg === "start") {
      console.log("Client start XP. Start collecting numbers.");
      xpStarted = true;
    }
  });

  ws.on("close", function() {
    console.log("Connection closed.");
    wsConnection = null;
  });
});
