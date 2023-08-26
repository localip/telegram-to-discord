import { createLogger } from '@lib/logger';
import { MessageEvent, WebSocketServer } from 'ws';
import { Store } from '@lib';

const Logger = createLogger('Web');

const ws = new WebSocketServer({ port: 8098 });

ws.on('connection', (socket) => {
	Logger.info('Client connected to WebSocket server.');

	function callback() {
		const messages = JSON.stringify(Store.messages);
		socket.send(messages);
	}


	Store.on('changed', callback);
	socket.on('error', console.error);

	socket.on('message', (data) => {
		if (data.toString() === 'DELETE') {
			Store.delete();
		}

		callback();
	});

	socket.on('close', () => {
		Logger.info('Client disconnected from WebSocket server.');
		Store.off('changed', callback);
	});

	callback();
});

ws.on('listening', () => {
	Logger.success('WebSocket server listening on port 8098');
});