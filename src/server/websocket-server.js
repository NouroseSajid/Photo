const { WebSocketServer } = require('ws');
const { registerClient } = require('../shared/logStore');

const wss = new WebSocketServer({ port: 3030 });
console.log('🧠 WebSocket server listening on ws://localhost:3030');

wss.on('connection', registerClient);
