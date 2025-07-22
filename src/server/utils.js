// Utility functions
import path from 'path';
import fs from 'fs/promises';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const ensureDir = (p) => fs.mkdir(p, { recursive: true });
export const isImage = (f) =>
  ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].some((ext) =>
    f.toLowerCase().endsWith(ext)
  );

// absolute paths
import { CONFIG } from './config.js';
export const baseDir = path.resolve();
export const fullDir = path.isAbsolute(CONFIG.FULL_DIR)
  ? CONFIG.FULL_DIR
  : path.join(baseDir, CONFIG.FULL_DIR);
export const thumbDir = path.isAbsolute(CONFIG.THUMB_DIR)
  ? CONFIG.THUMB_DIR
  : path.join(baseDir, CONFIG.THUMB_DIR);
export const mediumDir = path.isAbsolute(CONFIG.MEDIUM_DIR)
  ? CONFIG.MEDIUM_DIR
  : path.join(baseDir, CONFIG.MEDIUM_DIR);
