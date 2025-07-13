const logs = [];
const clients = [];

function addLog(msg) {
  const timestamp = new Date().toLocaleTimeString();
  const fullMsg = `[${timestamp}] ${msg}`;
  logs.push(fullMsg);
  if (logs.length > 50) logs.shift();
  for (const client of clients) {
    try {
      client.send(JSON.stringify({ type: 'log', msg: fullMsg }));
    } catch {}
  }
}

function getLogs() {
  return logs;
}

function broadcast(data) {
  for (const client of clients) {
    try {
      client.send(JSON.stringify(data));
    } catch {}
  }
}

function registerClient(ws) {
  clients.push(ws);
  logs.forEach(log => ws.send(JSON.stringify({ type: 'log', msg: log })));
  ws.on('close', () => {
    const index = clients.indexOf(ws);
    if (index !== -1) clients.splice(index, 1);
  });
}

module.exports = {
  addLog,
  getLogs,
  broadcast,
  registerClient
};
