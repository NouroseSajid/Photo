import { CONFIG } from './config.js';
import { ensureDir, fullDir, thumbDir, mediumDir } from './utils.js';
import { migrateLegacyImages } from './migrate.js';
import { ImageProcessor } from './processor.js';
import { startWatcher } from './watcher.js';
import { createWebSocketServer } from './ws.js';
import { createServer } from 'http';

// Instantiate processor
export const processor = new ImageProcessor();

// Create WebSocket server
const wss = createWebSocketServer();

// Dev status endpoint (optional)
const status = createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ clients: wss.clients.size }));
});
status.listen(3031, () => console.log('Status endpoint on http://localhost:3031'));

// Ping logic
let pingTimer;
function startPing() {
  pingTimer = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, CONFIG.PING_INTERVAL);
  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
  });
}

// ---------- INIT ----------
async function init() {
  await ensureDir(fullDir);
  await ensureDir(thumbDir);
  await ensureDir(mediumDir);
  await migrateLegacyImages();
  const watcher = startWatcher();
  startPing();
  console.log('Image WebSocket server fully initialized');
  return watcher;
}

let watcher;
init().then((w) => (watcher = w));

// ---------- SHUTDOWN ----------
const shutdown = async (sig) => {
  console.log(`\n${sig} received – shutting down`);
  clearInterval(pingTimer);
  if (watcher) await watcher.close();
  status.close();
  await new Promise((resolve) => wss.close(resolve));
  process.exit(0);
};
['SIGTERM', 'SIGINT', 'SIGHUP'].forEach((s) => process.on(s, () => shutdown(s)));

process.on('uncaughtException', (e) => {
  console.error(e);
  process.exit(1);
});
process.on('unhandledRejection', (r) => {
  console.error('Unhandled rejection', r);
  process.exit(1);
});
