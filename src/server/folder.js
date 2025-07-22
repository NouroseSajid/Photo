// Folder helpers
import path from 'path';
import fs from 'fs/promises';
import { ensureDir, fullDir, thumbDir, mediumDir, isImage } from './utils.js';

const generateHexFolderName = (number) => {
  return number.toString(16).padStart(6, '0');
};

let _lock = false;
let _queue = [];
let _resolvedFolder = null; // Store the resolved folder name

export async function resolveTargetFolder() {
  if (_lock) {
    return new Promise((resolve) => _queue.push(resolve));
  }
  _lock = true;

  try {
    const dirs = await fs.readdir(fullDir).catch(() => []);
    const candidates = [];

    for (const d of dirs) {
      const match = d.match(/^([0-9a-fA-F]{6})$/); // Match 6-character hex folder names
      if (match) {
        const p = path.join(fullDir, d);
        const st = await fs.stat(p).catch(() => null);
        if (st?.isDirectory()) {
          candidates.push({
            name: d,
            mtime: st.mtime,
            hexValue: parseInt(d, 16), // Store the integer value of the hex name
          });
        }
      }
    }

    candidates.sort((a, b) => b.hexValue - a.hexValue || b.mtime - a.mtime);

    let targetFolder;
    if (candidates.length > 0) {
      const newest = candidates[0];
      const filesInNewest = await fs.readdir(path.join(fullDir, newest.name)).catch(() => []);
      if (filesInNewest.filter((f) => isImage(f)).length < 100) {
        targetFolder = newest.name;
      } else {
        const nextHexValue = newest.hexValue + 1;
        targetFolder = generateHexFolderName(nextHexValue);
      }
    } else {
      targetFolder = generateHexFolderName(0); // Start with 000000 if no folders exist
    }

    await Promise.all([
      ensureDir(path.join(fullDir, targetFolder)),
      ensureDir(path.join(thumbDir, targetFolder)),
      ensureDir(path.join(mediumDir, targetFolder)),
    ]);

    _resolvedFolder = targetFolder;
    return targetFolder;
  } finally {
    _lock = false;
    while (_queue.length) {
      _queue.shift()(_resolvedFolder);
    }
    _resolvedFolder = null;
  }
}