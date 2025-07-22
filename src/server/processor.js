// Image processing logic
import path from 'path';
import sharp from 'sharp';
import fs from 'fs/promises';
import { CONFIG } from './config.js';
import { ensureDir, thumbDir, mediumDir } from './utils.js';
import { addLog } from '../shared/logStore.js';


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class ImageProcessor {
  constructor() {
    this.queue = [];
    this.active = 0;
  }

  async withRetry(fn) {
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === CONFIG.MAX_RETRY_ATTEMPTS) throw err;
        addLog(`Attempt ${attempt} failed: ${err.message} – retrying…`);
        await sleep(CONFIG.RETRY_DELAY * attempt);
      }
    }
  }

  async generateImage(input, output, width) {
    await ensureDir(path.dirname(output));
    return this.withRetry(async () => {
      let p = sharp(input).rotate().resize({ width, fit: 'inside', withoutEnlargement: true });
      const ext = path.extname(output).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg') {
        p = p.jpeg({ quality: CONFIG.JPEG_QUALITY, progressive: true });
      } else if (ext === '.webp') {
        p = p.webp({ quality: CONFIG.WEBP_QUALITY });
      } else if (ext === '.png') {
        p = p.png({ compressionLevel: 6 });
      }
      await p.toFile(output);
    });
  }

  async processImage(fullPath, filename) {
    const folder = path.basename(path.dirname(fullPath));
    const thumb = path.join(thumbDir, folder, filename);
    const medium = path.join(mediumDir, folder, filename);
    let changed = false;

    const stats = await fs.stat(fullPath).catch(() => null);
    if (stats && stats.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`File too big (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
    }

    // Ensure thumbnail exists
    if (!(await fs.stat(thumb).catch(() => null))) {
      console.log(`Generating thumbnail for ${filename} at ${thumb}`);
      await this.generateImage(fullPath, thumb, CONFIG.THUMBNAIL_WIDTH);
      changed = true;
    }

    if (!(await fs.stat(medium).catch(() => null))) {
      console.log(`Generating medium image for ${filename} at ${medium}`);
      await this.generateImage(fullPath, medium, CONFIG.MEDIUM_WIDTH);
      changed = true;
    }
    return changed;
  }

  async queue(src, filename) {
    return new Promise((resolve) => {
      this.queue.push(async () => {
        try {
          const res = await this.processImage(src, filename);
          resolve(res);
        } finally {
          this.active--;
          if (this.queue.length) setImmediate(() => this.tick());
        }
      });
      this.tick();
    });
  }

  tick() {
    while (this.queue.length && this.active < CONFIG.MAX_CONCURRENT_PROCESSING) {
      this.active++;
      const job = this.queue.shift();
      job();
    }
  }
}
