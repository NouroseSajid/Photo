// Folder helpers
import path from 'path';
import fs from 'fs/promises';
import { ensureDir, fullDir, thumbDir, mediumDir, isImage } from './utils.js';

export const folderName = () => {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
    const baseName = folderName();
    const dirs = await fs.readdir(fullDir).catch(() => []);
    const candidates = [];

    for (const d of dirs) {
      const match = d.match(new RegExp(`^${baseName}(?:-(\d+))?$`));
      if (match) {
        const p = path.join(fullDir, d);
        const st = await fs.stat(p).catch(() => null);
        if (st?.isDirectory()) {
          candidates.push({
            name: d,
            mtime: st.mtime,
            suffix: match[1] ? parseInt(match[1], 10) : 0,
          });
        }
      }
    }

    candidates.sort((a, b) => b.suffix - a.suffix || b.mtime - a.mtime);

    let targetFolder;
    if (candidates.length > 0) {
      const newest = candidates[0];
      const filesInNewest = await fs.readdir(path.join(fullDir, newest.name)).catch(() => []);
      if (filesInNewest.filter((f) => isImage(f)).length < 100) {
        targetFolder = newest.name;
      } else {
        const nextSuffix = newest.suffix + 1;
        targetFolder = `${baseName}-${nextSuffix}`;
      }
    } else {
      targetFolder = baseName;
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