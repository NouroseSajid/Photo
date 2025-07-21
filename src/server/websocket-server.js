import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { registerClient, addLog, broadcast, getClientCount } from '../shared/logStore.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// --- Configuration ---
const CONFIG = {
  WS_PORT: process.env.WS_PORT || 3030,
  PING_INTERVAL: parseInt(process.env.PING_INTERVAL) || 30000,
  DEBOUNCE_DELAY: parseInt(process.env.DEBOUNCE_DELAY) || 1000,
  THUMBNAIL_WIDTH: parseInt(process.env.THUMBNAIL_WIDTH) || 400,
  MEDIUM_WIDTH: parseInt(process.env.MEDIUM_WIDTH) || 1200,
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
  MAX_CONCURRENT_PROCESSING: parseInt(process.env.MAX_CONCURRENT_PROCESSING) || 5,
  JPEG_QUALITY: parseInt(process.env.JPEG_QUALITY) || 85,
  WEBP_QUALITY: parseInt(process.env.WEBP_QUALITY) || 80,
  MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY) || 1000,
  QUEUE_SIZE_LIMIT: parseInt(process.env.QUEUE_SIZE_LIMIT) || 100,
  AUTH_TOKEN: process.env.WS_AUTH_TOKEN || '',
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 10000, // ms
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 20,
  FULL_DIR: process.env.FULL_DIR || 'public/images/full',
  THUMB_DIR: process.env.THUMB_DIR || 'public/images/thumbs',
  MEDIUM_DIR: process.env.MEDIUM_DIR || 'public/images/medium',
};

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

// --- Utility Functions ---
const isImageFile = (filename) => 
  SUPPORTED_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const getFileStats = async (filePath) => {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
};

// --- WebSocket Server Setup ---
const wss = new WebSocketServer({ 
  port: CONFIG.WS_PORT,
  perMessageDeflate: false // Disable compression for better performance
});

console.log(`🧠 WebSocket server listening on ws://localhost:${CONFIG.WS_PORT}`);

let pingInterval;
let isShuttingDown = false;

const startPingInterval = () => {
  pingInterval = setInterval(() => {
    if (isShuttingDown) return;
    
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        try {
          client.ping();
        } catch (error) {
          addLog(`Ping error: ${error.message}`);
          broadcast({ type: 'error', message: `Ping error: ${error.message}` });
        }
      }
    });
  }, CONFIG.PING_INTERVAL);
};

// --- WebSocket Connection Handling ---

// --- Simple WebSocket Auth and Rate Limiting ---
wss.on('connection', (ws, request) => {
  const clientIp = request.socket.remoteAddress;
  // Simple token auth via query param or header
  let token = '';
  try {
    const url = new URL(request.url, `ws://${request.headers.host}`);
    token = url.searchParams.get('token') || request.headers['sec-websocket-protocol'] || '';
  } catch {}
  if (CONFIG.AUTH_TOKEN && token !== CONFIG.AUTH_TOKEN) {
    addLog(`Rejected client from ${clientIp}: invalid auth token.`);
    ws.close(4001, 'Invalid authentication token');
    return;
  }

  addLog(`New client connected from ${clientIp}. Total clients: ${wss.clients.size}`);
  registerClient(ws);

  // Rate limiting state
  ws._rateLimit = { count: 0, windowStart: Date.now() };

  ws.on('close', (code, reason) => {
    addLog(`Client ${clientIp} disconnected (${code}). Total clients: ${wss.clients.size}`);
  });

  ws.on('error', (error) => {
    addLog(`WebSocket error for client ${clientIp}: ${error.message}`);
    broadcast({ type: 'error', message: `WebSocket error for client ${clientIp}: ${error.message}` });
  });

  ws.on('message', (message) => {
    // --- Rate Limiting ---
    const now = Date.now();
    if (!ws._rateLimit) ws._rateLimit = { count: 0, windowStart: now };
    if (now - ws._rateLimit.windowStart > CONFIG.RATE_LIMIT_WINDOW) {
      ws._rateLimit.count = 0;
      ws._rateLimit.windowStart = now;
    }
    ws._rateLimit.count++;
    if (ws._rateLimit.count > CONFIG.RATE_LIMIT_MAX) {
      addLog(`Rate limit exceeded for client ${clientIp}`);
      ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded. Please slow down.' }));
      return;
    }

    try {
      const data = JSON.parse(message.toString());
      // Enhanced message validation
      if (data.type === 'log' && typeof data.msg === 'string' && data.msg.length <= 1000) {
        addLog(`Client log: ${data.msg}`);
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      } else {
        addLog(`Invalid message format from client ${clientIp}`);
      }
    } catch (error) {
      addLog(`WebSocket message parsing error from ${clientIp}: ${error.message}`);
      broadcast({ type: 'error', message: `WebSocket message parsing error from ${clientIp}: ${error.message}` });
    }
  });
});

wss.on('close', () => {
  if (pingInterval) {
    clearInterval(pingInterval);
  }
});

startPingInterval();

// --- Directory Setup ---
const baseDir = process.cwd();
const fullDir = path.isAbsolute(CONFIG.FULL_DIR) ? CONFIG.FULL_DIR : path.join(baseDir, CONFIG.FULL_DIR);
const thumbDir = path.isAbsolute(CONFIG.THUMB_DIR) ? CONFIG.THUMB_DIR : path.join(baseDir, CONFIG.THUMB_DIR);
const mediumDir = path.isAbsolute(CONFIG.MEDIUM_DIR) ? CONFIG.MEDIUM_DIR : path.join(baseDir, CONFIG.MEDIUM_DIR);

// --- Debounced Refresh Logic ---
const createDebouncedRefresh = () => {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (!isShuttingDown) {
        broadcast({ type: 'refresh', timestamp: Date.now() });
        addLog(`Sent debounced refresh to ${getClientCount()} clients.`);
      }
    }, CONFIG.DEBOUNCE_DELAY);
  };
};

const debouncedBroadcastRefresh = createDebouncedRefresh();

// --- Enhanced Image Processing ---
class ImageProcessor {
  constructor() {
    this.processingQueue = [];
    this.activeProcessing = 0;
  }

  async processWithRetry(operation, maxRetries = CONFIG.MAX_RETRY_ATTEMPTS) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        addLog(`Processing attempt ${attempt} failed: ${error.message}. Retrying...`);
        broadcast({ type: 'error', message: `Processing attempt ${attempt} failed: ${error.message}. Retrying...` });
        await sleep(CONFIG.RETRY_DELAY * attempt);
      }
    }
  }

  async generateImage(inputPath, outputPath, width, format = null) {
    return this.processWithRetry(async () => {
      let pipeline = sharp(inputPath)
        .rotate() // Auto-rotate based on EXIF
        .resize({ 
          width, 
          height: undefined,
          fit: 'inside',
          withoutEnlargement: true
        });

      // Apply format-specific optimizations
      const ext = path.extname(outputPath).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg') {
        pipeline = pipeline.jpeg({ quality: CONFIG.JPEG_QUALITY, progressive: true });
      } else if (ext === '.webp') {
        pipeline = pipeline.webp({ quality: CONFIG.WEBP_QUALITY });
      } else if (ext === '.png') {
        pipeline = pipeline.png({ compressionLevel: 6 });
      }

      await pipeline.toFile(outputPath);
    });
  }

  async processImage(fullPath, filename) {
    const thumbPath = path.join(thumbDir, filename);
    const mediumPath = path.join(mediumDir, filename);
    const messages = [];
    let hasChanges = false;

    try {
      // Check file size
      const stats = await getFileStats(fullPath);
      if (stats && stats.size > CONFIG.MAX_FILE_SIZE) {
        throw new Error(`File size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds maximum allowed (${Math.round(CONFIG.MAX_FILE_SIZE / 1024 / 1024)}MB)`);
      }

      // Generate thumbnail if it doesn't exist
      if (!(await getFileStats(thumbPath))) {
        await this.generateImage(fullPath, thumbPath, CONFIG.THUMBNAIL_WIDTH);
        messages.push('✅ Thumbnail generated');
        hasChanges = true;
      }

      // Generate medium image if it doesn't exist
      if (!(await getFileStats(mediumPath))) {
        await this.generateImage(fullPath, mediumPath, CONFIG.MEDIUM_WIDTH);
        messages.push('✅ Medium image generated');
        hasChanges = true;
      }

      if (messages.length > 0) {
        const logMessage = `Processed ${filename}: ${messages.join(', ')}`;
        console.log(logMessage);
        addLog(logMessage);
      }

      return hasChanges;

    } catch (error) {
      const errorMessage = `❌ Failed to process ${filename}: ${error.message}`;
      console.error(errorMessage);
      addLog(errorMessage);
      broadcast({ type: 'error', message: errorMessage });
      return false;
    }
  }

  async processQueue() {
    while (this.processingQueue.length > 0 && this.activeProcessing < CONFIG.MAX_CONCURRENT_PROCESSING) {
      const task = this.processingQueue.shift();
      this.activeProcessing++;
      task().finally(() => {
        this.activeProcessing--;
        if (this.processingQueue.length > 0) {
          setImmediate(() => this.processQueue());
        }
      });
    }
  }

  async queueImageProcessing(fullPath, filename) {
    // Always queue the request, never drop. Promise resolves when processed.
    return new Promise((resolve) => {
      this.processingQueue.push(async () => {
        const result = await this.processImage(fullPath, filename);
        resolve(result);
      });
      this.processQueue();
    });
  }
}

const imageProcessor = new ImageProcessor();

// --- File System Operations ---
async function safeUnlink(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

async function processExistingImages() {
  try {
    addLog('Scanning for existing images...');
    
    const files = await fs.readdir(fullDir);
    const imageFiles = files.filter(isImageFile);
    
    if (imageFiles.length === 0) {
      addLog('No images found to process.');
      return;
    }

    addLog(`Found ${imageFiles.length} images to process.`);
    
    // Process in batches to avoid overwhelming the system
    const batchSize = CONFIG.MAX_CONCURRENT_PROCESSING;
    let processedAny = false;
    
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      const promises = batch.map(filename => 
        imageProcessor.queueImageProcessing(path.join(fullDir, filename), filename)
      );
      
      const results = await Promise.allSettled(promises);
      if (results.some(result => result.status === 'fulfilled' && result.value)) {
        processedAny = true;
      }
    }

    if (processedAny) {
      addLog('Finished processing existing images.');
      debouncedBroadcastRefresh();
    } else {
      addLog('No existing images needed processing.');
    }

  } catch (error) {
    addLog(`Error scanning existing images: ${error.message}`);
    broadcast({ type: 'error', message: `Error scanning existing images: ${error.message}` });
  }
}

// --- File Watcher Setup ---
function startImageWatcher() {
  addLog('Starting image watcher...');
  
  const watcher = chokidar.watch(fullDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', async (fullPath) => {
      const filename = path.basename(fullPath);
      if (!isImageFile(filename)) return;
      
      addLog(`🆕 New image detected: ${filename}`);
      
      try {
        if (await imageProcessor.queueImageProcessing(fullPath, filename)) {
          debouncedBroadcastRefresh();
        }
      } catch (error) {
        addLog(`Error processing new image ${filename}: ${error.message}`);
        broadcast({ type: 'error', message: `Error processing new image ${filename}: ${error.message}` });
      }
    })
    .on('unlink', async (fullPath) => {
      const filename = path.basename(fullPath);
      const thumbPath = path.join(thumbDir, filename);
      const mediumPath = path.join(mediumDir, filename);
      const messages = [`🗑️ Image deleted: ${filename}`];

      try {
        if (await safeUnlink(thumbPath)) {
          messages.push('🗑️ Thumbnail removed');
        }
        if (await safeUnlink(mediumPath)) {
          messages.push('🗑️ Medium image removed');
        }
        
        const logMessage = messages.join(' | ');
        console.log(logMessage);
        addLog(logMessage);
        debouncedBroadcastRefresh();
      } catch (error) {
        addLog(`Error cleaning up files for ${filename}: ${error.message}`);
        broadcast({ type: 'error', message: `Error cleaning up files for ${filename}: ${error.message}` });
      }
    })
    .on('error', (error) => {
      addLog(`File watcher error: ${error.message}`);
      broadcast({ type: 'error', message: `File watcher error: ${error.message}` });
    });

  return watcher;
}

// --- Initialization ---
async function initialize() {
  try {
    // Ensure directories exist
    await ensureDirectoryExists(fullDir);
    await ensureDirectoryExists(thumbDir);
    await ensureDirectoryExists(mediumDir);
    
    addLog('Directory structure initialized.');
    
    // Process existing images
    await processExistingImages();
    
    // Start file watcher
    const watcher = startImageWatcher();
    
    addLog('Image processing server fully initialized.');
    
    return watcher;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    addLog(`Initialization error: ${error.message}`);
    broadcast({ type: 'error', message: `Initialization error: ${error.message}` });
    process.exit(1);
  }
}

// --- Graceful Shutdown ---
async function gracefulShutdown(signal, watcher) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  isShuttingDown = true;
  
  try {
    // Clear intervals
    if (pingInterval) {
      clearInterval(pingInterval);
    }
    
    // Close file watcher
    if (watcher) {
      await watcher.close();
      console.log('File watcher closed.');
    }
    
    // Close WebSocket server
    await new Promise((resolve) => {
      wss.close((error) => {
        if (error) {
          console.error('Error closing WebSocket server:', error);
        } else {
          console.log('WebSocket server closed.');
        }
        resolve();
      });
    });
    
    console.log('Graceful shutdown completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// --- Start Server ---
(async () => {
  const watcher = await initialize();
  
  // Setup signal handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM', watcher));
  process.on('SIGINT', () => gracefulShutdown('SIGINT', watcher));
  process.on('SIGHUP', () => gracefulShutdown('SIGHUP', watcher));
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    addLog(`Uncaught exception: ${error.message}`);
    broadcast({ type: 'error', message: `Uncaught exception: ${error.message}` });
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    addLog(`Unhandled rejection: ${reason}`);
    broadcast({ type: 'error', message: `Unhandled rejection: ${reason}` });
  });
})();