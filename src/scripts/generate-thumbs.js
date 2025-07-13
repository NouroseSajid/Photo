const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const fullDir = path.join(process.cwd(), 'public/images/full');
const thumbDir = path.join(process.cwd(), 'public/images/thumbs');

if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

const imageFiles = fs.readdirSync(fullDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

(async () => {
  for (const file of imageFiles) {
    const thumbPath = path.join(thumbDir, file);
    const fullPath = path.join(fullDir, file);

    if (!fs.existsSync(thumbPath)) {
      await sharp(fullPath).resize({ width: 400 }).toFile(thumbPath);
      console.log(`✅ Thumbnail generated: ${file}`);
    }
  }
})();
