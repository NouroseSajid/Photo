// WebSocket server setup and connection handling
import { WebSocketServer } from 'ws';
import { CONFIG } from './config.js';
import { URLSearchParams } from 'url';

export function createWebSocketServer() {
  const wss = new WebSocketServer({
    port: CONFIG.WS_PORT,
    perMessageDeflate: false,
    verifyClient: (info) => {
      if (!CONFIG.AUTH_TOKEN) return true; // No auth token configured, allow all connections

      const url = new URLSearchParams(info.req.url.split('?')[1]);
      const token = url.get('token');

      if (token === CONFIG.AUTH_TOKEN) {
        return true; // Token matches, allow connection
      }
      console.warn('WebSocket connection denied: Invalid or missing token');
      return false; // Token mismatch, deny connection
    },
  });
  // ...rest of ws logic...
  return wss;
}
