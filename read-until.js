'use strict';

const fs = require('fs');

/*
* Read OneRNG until it get the exact amount of bytes
*/
function readUntilLengthReach(fd, length) {
	return new Promise((resolve, reject) => {
		const finalBuffer = new Buffer(length);
		let offset = 0;
		let bytesToRead = length;

		readRecursive();

		function readRecursive() {
			fs.read(fd, finalBuffer, offset, bytesToRead, null, function (err, bytesReaded, buffer) {
				if (err) {
					reject(err);
				}

				offset = offset + bytesReaded;
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

module.exports = readUntilLengthReach;
