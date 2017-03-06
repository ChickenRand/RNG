"use strict";

const fs = require('fs');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const ONERNG_BITRATE = 40950; // In byte per second

console.log('Server started at localhost:8080');

let rngFd = 0;
let wsConnection = null;

// On start up, try to read from oneRng device
fs.open('/dev/ttyACM0', 'r', function(status, fd) {
	if (status) {
		console.error(status.message);
		if(status.code === 'EACCES') {
			console.error('You should be root to access OneRNG stream.');
			process.exit(1);
		}
		return;
	}
	console.log('Connected to the random number generator');
	rngFd = fd;
});

function readAndSendBytes () {
	const bytesToRead = ONERNG_BITRATE / 10;
	const buffer = new Buffer(bytesToRead);
	fs.read(rngFd, buffer, 0, bytesToRead, null, function(err, num, buff) {
		if(err) {
			console.error(err, typeof err, num);
		}
		if(wsConnection != null) {
			wsConnection.send(buff, function (err) {
				if(err) {
					console.error('Error', err);
				}
			});
		}
	});
}
const id = setInterval(readAndSendBytes, 100);

wss.on('connection', function connection(ws) {
	// TODO : refuse more than one connection
	console.log('Client connection start sending numbers');
	wsConnection = ws;

	ws.on('close', function () {
		console.log('Connection closed. Stopping client interval');
		clearInterval(id);
		wsConnection = null;
	});
});
