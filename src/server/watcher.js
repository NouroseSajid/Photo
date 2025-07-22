// File watcher setup
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { addLog, broadcast } from '../shared/logStore.js';
import { debouncedBroadcastRefresh } from './debounce.js';
import { resolveTargetFolder } from './folder.js';
import { ImageProcessor } from './processor.js';
import { fullDir, thumbDir, mediumDir, isImage } from './utils.js';

const processor = new ImageProcessor();

export function startWatcher() {
  const watcher = chokidar.watch(fullDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 5000, pollInterval: 500 },
    depth: 0, // Prevent recursive events
  });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  watcher
    .on('add', async (filePath) => {
      const name = path.basename(filePath);
      if (!isImage(name)) return;
      const folder = await resolveTargetFolder();
      const dest = path.join(fullDir, folder, name);
      try {
        await sleep(1000); // Add a small delay before moving and processing
        await fs.rename(filePath, dest);
      } catch (err) {
        addLog(`Failed to move ${name}: ${err.message}`);
        console.error(`Failed to move ${name}:`, err);
        return; // Stop processing if rename fails
      }
      await processor.processImage(dest, name);
      debouncedBroadcastRefresh();
    })
    .on('unlink', async (filePath) => {
      const name = path.basename(filePath);
      const folder = path.basename(path.dirname(filePath)); // Extract folder from filePath
      try {
        await fs.unlink(path.join(thumbDir, folder, name));
      } catch (err) {
        if (err.code !== 'ENOENT') { // Ignore file not found errors
          console.error(`Failed to delete thumbnail for ${name}:`, err);
        }
      }
      try {
        await fs.unlink(path.join(mediumDir, folder, name));
      } catch (err) {
        if (err.code !== 'ENOENT') { // Ignore file not found errors
          console.error(`Failed to delete medium image for ${name}:`, err);
        }
      }
      addLog(`🗑️ Removed ${name}`);
      debouncedBroadcastRefresh();
    })
    .on('error', (err) => {
      addLog(`Watcher error: ${err.message}`);
      broadcast({ type: 'error', message: `Watcher error: ${err.message}` });
    });
  return watcher;
}
