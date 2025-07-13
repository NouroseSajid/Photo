const chokidar = require('chokidar');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { addLog, broadcast } = require('../shared/logStore');

const fullDir = path.join(process.cwd(), 'public/images/full');
const thumbDir = path.join(process.cwd(), 'public/images/thumbs');

chokidar.watch(fullDir).on('add', async (fullPath) => {
  const filename = path.basename(fullPath);
  if (!/\.(jpg|jpeg|png|webp)$/i.test(filename)) return;

  const thumbPath = path.join(thumbDir, filename);
  if (fs.existsSync(thumbPath)) return;

  try {
    await sharp(fullPath).resize({ width: 400 }).toFile(thumbPath);
    const msg = `🆕 Image detected: ${filename}\n✅ Converted to thumbnail`;
    console.log(msg);
    addLog(msg);
    broadcast({ type: 'refresh' }); // notify client to reload
  } catch (error) {
    const errMsg = `❌ Failed to generate thumbnail for ${filename}: ${error.message}`;
    console.error(errMsg);
    addLog(errMsg);
  }
});
