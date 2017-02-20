"use strict";

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log('server started at localhost:8080');

wss.on('connection', function connection(ws) {
	function randomIntInc (low, high) {
		return Math.floor(Math.random() * (high - low + 1) + low);
	}

	console.log('Connection ! ');
	function sendBytes () {
		const bytes = new Uint8Array(25);

		for (var i = 0; i < bytes.length; ++i) {
			bytes[i] = randomIntInc(0, 255);
		}

		ws.send(bytes, function (err) {
			if(err) {
				console.log(err);
			}
		});
	}
	const id = setInterval(sendBytes, 100);

	ws.on('close', function () {
		console.log('stopping client interval');
		clearInterval(id);
	});
});
