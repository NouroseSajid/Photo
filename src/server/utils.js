// Utility functions
import path from 'path';
import fs from 'fs/promises';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const ensureDir = (p) => fs.mkdir(p, { recursive: true });

const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

export const isImage = (f) => imageExtensions.some((ext) => f.toLowerCase().endsWith(ext));
export const isVideo = (f) => videoExtensions.some((ext) => f.toLowerCase().endsWith(ext));
export const isMedia = (f) => isImage(f) || isVideo(f);


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
export const clipsDir = path.join(baseDir, 'public', 'clips', 'full');
export const clipsThumbDir = path.join(baseDir, 'public', 'clips', 'thumbs');
export const clipsMediumDir = path.join(baseDir, 'public', 'clips', 'medium');
