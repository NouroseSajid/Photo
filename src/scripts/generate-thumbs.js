const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const fullDir = path.join(process.cwd(), 'public/images/full');
const thumbDir = path.join(process.cwd(), 'public/images/thumbs');
const mediumDir = path.join(process.cwd(), 'public/images/medium');

if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
if (!fs.existsSync(mediumDir)) fs.mkdirSync(mediumDir, { recursive: true });

const imageFiles = fs.readdirSync(fullDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

async function generateImages() {
  for (const file of imageFiles) {
    const fullPath = path.join(fullDir, file);
    const thumbPath = path.join(thumbDir, file);
    const mediumPath = path.join(mediumDir, file);

    // Generate thumbnail (with rotation)
    if (!fs.existsSync(thumbPath)) {
      await sharp(fullPath)
        .rotate() // Apply rotation
        .resize({ width: 400 })
        .toFile(thumbPath);
      console.log(`✅ Thumbnail generated: ${file}`);
    }

    // Generate medium (with rotation)
    if (!fs.existsSync(mediumPath)) {
      await sharp(fullPath)
        .rotate() // Apply rotation
        .resize({ width: 1200 })
        .toFile(mediumPath);
      console.log(`✅ Medium image generated: ${file}`);
    }
  }
}

generateImages();