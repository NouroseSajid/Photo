const { WebSocketServer } = require('ws');
const chokidar = require('chokidar');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { registerClient, addLog, broadcast, getClientCount } = require('../shared/logStore');

const wss = new WebSocketServer({ port: 3030 });
console.log('🧠 WebSocket server listening on ws://localhost:3030');

// --- WebSocket Server Logic ---

const interval = setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) client.ping();
  });
}, 30000);

wss.on('connection', (ws) => {
  addLog(`New client connected. Total clients: ${wss.clients.size}`);
  registerClient(ws);

  ws.on('close', () => addLog(`Client disconnected. Total clients: ${wss.clients.size}`));
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'log' && typeof data.msg === 'string') addLog(data.msg);
    } catch (e) {
      addLog(`WebSocket message error: ${e.message}`);
    }
  });
});

wss.on('close', () => clearInterval(interval));

// --- Image Watcher Logic ---

const fullDir = path.join(process.cwd(), 'public/images/full');
const thumbDir = path.join(process.cwd(), 'public/images/thumbs');
const mediumDir = path.join(process.cwd(), 'public/images/medium');

addLog('Image watcher starting...');

chokidar.watch(fullDir)
  .on('add', async (fullPath) => {
    const filename = path.basename(fullPath);
    if (!/\.(jpg|jpeg|png|webp)$/i.test(filename)) return;

    const thumbPath = path.join(thumbDir, filename);
    const mediumPath = path.join(mediumDir, filename);
    
    let messages = [`🆕 Image detected: ${filename}`];
    const tasks = [];

    if (!fs.existsSync(thumbPath)) {
      tasks.push(
        sharp(fullPath).resize({ width: 400 }).toFile(thumbPath)
          .then(() => messages.push('✅ Converted to thumbnail'))
          .catch(err => messages.push(`❌ Thumbnail error: ${err.message}`))
      );
    }
    if (!fs.existsSync(mediumPath)) {
      tasks.push(
        sharp(fullPath).resize({ width: 1200 }).toFile(mediumPath)
          .then(() => messages.push('✅ Converted to medium image'))
          .catch(err => messages.push(`❌ Medium image error: ${err.message}`))
      );
    }

    if (tasks.length > 0) await Promise.all(tasks);

    addLog(messages.join(' | '));
    broadcast({ type: 'refresh' });
    addLog(`Sent refresh to ${getClientCount()} clients.`);
  })
  .on('unlink', (fullPath) => {
    const filename = path.basename(fullPath);
    const thumbPath = path.join(thumbDir, filename);
    const mediumPath = path.join(mediumDir, filename);
    
    let messages = [`🗑️ Image deleted: ${filename}`];
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
      messages.push('🗑️ Thumbnail removed');
    }
    if (fs.existsSync(mediumPath)) {
      fs.unlinkSync(mediumPath);
      messages.push('🗑️ Medium image removed');
    }

    addLog(messages.join(' | '));
    broadcast({ type: 'refresh' });
    addLog(`Sent refresh to ${getClientCount()} clients.`);
  });

// --- Graceful Shutdown ---

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing WebSocket server.');
  wss.close(() => console.log('WebSocket server closed.'));
});

