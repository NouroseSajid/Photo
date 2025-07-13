const sharp = require('sharp');
const path = require('path');

const fullPath = path.join(process.cwd(), 'public/images/full', 'Screenshot 2025-05-06 181813.png');
const thumbPath = path.join(process.cwd(), 'public/images/thumbs', 'test.jpg');

sharp(fullPath)
  .resize({ width: 400 })
  .toFile(thumbPath)
  .then(() => console.log('Processed'))
  .catch(err => console.error(err));
