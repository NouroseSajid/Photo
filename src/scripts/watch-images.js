const chokidar = require('chokidar');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { addLog, broadcast, getClientCount } = require('../shared/logStore');

// Log current clients before starting watcher
try {
  const clients = require('../shared/logStore').clients || [];
  addLog(`Starting image watcher. Current clients: ${clients.length}`);
  console.log('WebSocket clients:', clients);
} catch (e) {
  addLog('Starting image watcher. (Could not get clients count)');
  console.log('WebSocket clients: (Could not get clients)', e);
}

const fullDir = path.join(process.cwd(), 'public/images/full');
const thumbDir = path.join(process.cwd(), 'public/images/thumbs');
const mediumDir = path.join(process.cwd(), 'public/images/medium');

chokidar.watch(fullDir)
  .on('add', async (fullPath) => {
    const filename = path.basename(fullPath);
    if (!/\.(jpg|jpeg|png|webp)$/i.test(filename)) return;

    const thumbPath = path.join(thumbDir, filename);
    const mediumPath = path.join(mediumDir, filename);
    
    let messages = [`🆕 Image detected: ${filename}`];

    const thumbExists = fs.existsSync(thumbPath);
    const mediumExists = fs.existsSync(mediumPath);
    if (thumbExists) messages.push('Thumbnail already exists.');
    if (mediumExists) messages.push('Medium image already exists.');

    const tasks = [];
    if (!thumbExists) tasks.push(
      sharp(fullPath).resize({ width: 400 }).toFile(thumbPath)
        .then(() => messages.push('✅ Converted to thumbnail'))
        .catch(error => messages.push(`❌ Failed to generate thumbnail: ${error.message}`))
    );
    if (!mediumExists) tasks.push(
      sharp(fullPath).resize({ width: 1200 }).toFile(mediumPath)
        .then(() => messages.push('✅ Converted to medium image'))
        .catch(error => messages.push(`❌ Failed to generate medium image: ${error.message}`))
    );

    if (tasks.length) await Promise.all(tasks);

    const finalMessage = messages.join('\n');
    console.log(finalMessage);
    addLog(finalMessage);

    broadcast({ type: 'refresh' });
    addLog(`Broadcast refresh sent to ${getClientCount()} clients`);
  })
  .on('unlink', (fullPath) => {
    const filename = path.basename(fullPath);
    const thumbPath = path.join(thumbDir, filename);
    const mediumPath = path.join(mediumDir, filename);
    
    let messages = [`🗑️ Image deleted: ${filename}`];

    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
      messages.push('🗑️ Thumbnail removed');
    }

    if (fs.existsSync(mediumPath)) {
      fs.unlinkSync(mediumPath);
      messages.push('🗑️ Medium image removed');
    }

    const finalMessage = messages.join('\n');
    console.log(finalMessage);
    addLog(finalMessage);

    broadcast({ type: 'refresh' });
    addLog(`Broadcast refresh sent to ${getClientCount()} clients`);
  });
