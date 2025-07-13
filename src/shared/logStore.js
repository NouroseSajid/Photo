const logs = [];
const clients = new Set(); // Using Set instead of Array for automatic deduplication

function addLog(msg) {
  const timestamp = new Date().toISOString();
  const fullMsg = `[${timestamp}] ${msg}`;
  logs.push(fullMsg);
  if (logs.length > 50) logs.shift();
  console.log(fullMsg);
  // Send to all connected clients
  broadcast({ type: 'log', msg: fullMsg });
}

function getLogs() {
  return logs;
}

function broadcast(data) {
  const message = JSON.stringify(data);
  let sentCount = 0;
  clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(message);
        sentCount++;
      } catch (error) {
        console.error('Broadcast error:', error);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  });
  console.log(`Broadcast to ${sentCount} clients`);
  return sentCount;
}

function registerClient(ws) {
  clients.add(ws);
  // Send existing logs
  logs.forEach(log => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'log', msg: log }));
    }
  });
  ws.on('close', () => {
    clients.delete(ws);
  });
}

function getClientCount() {
  return clients.size;
}

module.exports = {
  addLog,
  getLogs,
  broadcast,
  registerClient,
  getClientCount
};
