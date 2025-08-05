// File watcher setup
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { addLog, broadcast } from '../shared/logStore.js';
import { debouncedBroadcastRefresh } from './debounce.js';
import { resolveTargetFolder } from './folder.js';
import { ImageProcessor } from './processor.js';
import { fullDir, thumbDir, mediumDir, clipsDir, clipsThumbDir, clipsMediumDir, isMedia, isVideo } from './utils.js';

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
      if (!isMedia(name)) return;
      const folder = await resolveTargetFolder();
      const dest = isVideo(name) ? path.join(clipsDir, folder, name) : path.join(fullDir, folder, name);
      try {
        await sleep(1000); // Add a small delay before moving and processing
        await fs.rename(filePath, dest);
      } catch (err) {
        addLog(`Failed to move ${name}: ${err.message}`);
        console.error(`Failed to move ${name}:`, err);
        return; // Stop processing if rename fails
      }
      await processor.processMedia(dest, name);
      debouncedBroadcastRefresh();
    })
    .on('unlink', async (filePath) => {
      const name = path.basename(filePath);
      const folder = path.basename(path.dirname(filePath)); // Extract folder from filePath
      const isVid = isVideo(name);
      const thumb = isVid ? path.join(clipsThumbDir, folder, `${path.parse(name).name}.png`) : path.join(thumbDir, folder, name);
      const medium = isVid ? path.join(clipsMediumDir, folder, `${path.parse(name).name}.png`) : path.join(mediumDir, folder, name);

      try {
        await fs.unlink(thumb);
      } catch (err) {
        if (err.code !== 'ENOENT') { // Ignore file not found errors
          console.error(`Failed to delete thumbnail for ${name}:`, err);
        }
      }
      try {
        await fs.unlink(medium);
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
