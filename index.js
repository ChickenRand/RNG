#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const readUntilLengthReach = require('./read-until');

const CHICKENRAND_URL = process.env.CHICKENRAND_URL || 'localhost';
const CHICKENRAND_PORT = process.env.CHICKENRAND_PORT || '7000';
const ONERNG_CHUNK = 4000; // In byte, so 32000 bits per trials
const ONERNG_PATH = process.env.ONERNG_PATH || '/dev/urandom'; //'/dev/ttyACM0';
const XP_TRIALS_COUNT = 100;

let rngFd = 0;
let wsConnection = null;
// We store all the XP data into a buffer array and then send them at the end
let xpData = [];
let xpStarted = false;

const wss = new WebSocket.Server({
	port: 8080,
	// Allow only one connection at a time
	verifyClient: () => wsConnection === null
});

console.log('Server started at localhost:8080');

function sendXpData(resolve, reject, index) {
	const buf = xpData[index];
	if(buf) {
		wsConnection.send(buf, function (err) {
			if (err) {
				reject(err);
			}
			sendXpData(resolve, reject, index + 1);
		});
	} else {
		resolve();
	}
}

// Recursively send all xp data buffer
function sendAllXpData() {
	return new Promise((resolve, reject) => {
		sendXpData(resolve, reject, 0);
	});
}

function readAndSendBytes() {
	const bytesToRead = ONERNG_CHUNK;

	try {
		readUntilLengthReach(rngFd, bytesToRead).then(buffer => {
			if (wsConnection !== null && wsConnection.readyState === WebSocket.OPEN
				&& xpStarted) {
				xpData.push(buffer);
				if(xpData.length === XP_TRIALS_COUNT) {
					console.log('Xp finished, start sending numbers.');
					xpStarted = false;
					// Start reading again only after sending all the datas
					sendAllXpData()
						.then(() => readAndSendBytes())
						.catch(err => console.error(err))
				} else {
					readAndSendBytes();
				}
			} else {
				readAndSendBytes();
			}
		});
	} catch (err) {
		console.error(err, typeof err);
	}
}

// On start up, try to read from oneRng device
fs.open(ONERNG_PATH, 'r', function (status, fd) {
	if (status) {
		console.error(status.message);
		if (status.code === 'EACCES') {
			console.error('You should be root to access OneRNG stream.');
			throw new Error('You should be root to access OneRNG stream.');
		}
		return;
	}
	console.log('Connected to the random number generator');
	rngFd = fd;
	readAndSendBytes();
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

wss.on('connection', function connection(ws) {
	console.log('Client connection.');
	wsConnection = ws;
	xpStarted = false;

	// User started the experiment
	ws.on('message', function (msg) {
		if(msg === 'start') {
			console.log('Client start XP. Start collecting numbers.')
			xpStarted = true;
			xpData = [];
		} else {
			const jsonMsg = JSON.parse(msg);
			if(jsonMsg.userXpId && xpData.length > 0) {
				console.log('Send raw data for userXp ', jsonMsg.userXpId, 'and close connection.');
				// TEMP CLOSE WS CONNECTION WITHOUT SENDING DATA
				// OUR FREE HEROKU server can't handle that
				// DON'T HAVE TIME AND MONEY TO SET UP A DEDICATED SERVER
				ws.close();
				// Send raw datas to chickenrand server
				// uploadRawData(Buffer.concat(xpData), jsonMsg.userXpId)
				// 	.then(() => ws.close())
				// 	.catch(err => {
				// 		console.error(err);
				// 		ws.close();
				// 	});
			}
		}
	});

	ws.on('close', function () {
		console.log('Connection closed.');
		wsConnection = null;
	});
});
