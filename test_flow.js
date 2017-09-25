#!/usr/bin/env node
'use strict';

const fs = require('fs');

const readUntilLengthReach = require('./read-until');

let rngFd = 0;
const ONERNG_PATH = '/dev/ttyACM0';
let startedTime = 0;
const BYTES_TO_READ = parseInt(process.argv[2]) || 4000;
let totalReadedBytes = 0;

console.log("Start to read at " + BYTES_TO_READ + " bytes rate");

function readLoop() {
	readUntilLengthReach(rngFd, BYTES_TO_READ).then(buffer => {
		totalReadedBytes += BYTES_TO_READ;
		if(totalReadedBytes === BYTES_TO_READ * 100) {
			let elapsedTime = (Date.now() - startedTime) / 1000;
			startedTime = Date.now();
			console.log('Readed : ' + totalReadedBytes + ' bytes in ' + elapsedTime + ' seconds.');
			totalReadedBytes = 0;
		}

		readLoop();
	});	
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
	startedTime = Date.now();
	rngFd = fd;
	readLoop();
});