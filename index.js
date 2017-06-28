#!/usr/bin/env node
'use strict';

const fs = require('fs');
const WebSocket = require('ws');

const ONERNG_CHUNK = 4095; // In byte
const ONERNG_PATH = '/dev/ttyACM0';

let rngFd = 0;
let wsConnection = null;

const wss = new WebSocket.Server({
	port: 8080,
	// Allow only one connection at a time
	verifyClient: () => wsConnection === null
});

console.log('Server started at localhost:8080');

/*
* Read OneRNG until it get the exact amount of bytes
*/
function readUntilLengthReach(fd, length) {
	return new Promise((resolve, reject) => {
		let finalBuffer = new Buffer(0);
		let bytesToRead = length;

		readRecursive();

		function readRecursive() {
			const tempBuffer = new Buffer(bytesToRead);
			fs.read(fd, tempBuffer, 0, bytesToRead, null, function (err, bytesReaded, buffer) {
				if (err) {
					reject(err);
				}

				finalBuffer = Buffer.concat([finalBuffer, buffer.slice(0, bytesReaded)], finalBuffer.length + bytesReaded);
				if (bytesReaded === bytesToRead) {
					resolve(finalBuffer);
				} else {
					bytesToRead -= bytesReaded;
					readRecursive();
				}
			});
		}
	});
}

function readAndSendBytes() {
	const bytesToRead = ONERNG_CHUNK;

	try {
		readUntilLengthReach(rngFd, bytesToRead).then(buffer => {
			if (wsConnection !== null) {
				wsConnection.send(buffer, function (err) {
					if (err) {
						console.error('Error', err);
					}
				});
			}
			readAndSendBytes();
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

wss.on('connection', function connection(ws) {
	console.log('Client connection start sending numbers');
	wsConnection = ws;

	ws.on('close', function () {
		console.log('Connection closed. Stopping client interval');
		wsConnection = null;
	});
});
