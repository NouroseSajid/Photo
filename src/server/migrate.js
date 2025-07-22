// Migrate legacy flat files into the first dated folder
import path from 'path';
import fs from 'fs/promises';
import { addLog } from '../shared/logStore.js';
import { fullDir, isImage } from './utils.js';
import { resolveTargetFolder } from './folder.js';
import { ImageProcessor } from './processor.js';

const processor = new ImageProcessor();

export async function migrateLegacyImages() {
  const files = (await fs.readdir(fullDir).catch(() => [])).filter(isImage);
  if (!files.length) return;
  const folder = await resolveTargetFolder();
  for (const f of files) {
    const oldPath = path.join(fullDir, f);
    const newPath = path.join(fullDir, folder, f);
    await fs.rename(oldPath, newPath);
    await processor.processImage(newPath, f);
  }
  addLog(`Migrated ${files.length} legacy image(s) into ${folder}`);
}
