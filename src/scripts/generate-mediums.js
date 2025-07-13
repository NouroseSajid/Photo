const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const fullDir = path.join(process.cwd(), 'public/images/full');
const mediumDir = path.join(process.cwd(), 'public/images/medium');

if (!fs.existsSync(mediumDir)) fs.mkdirSync(mediumDir, { recursive: true });

const imageFiles = fs.readdirSync(fullDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

(async () => {
  for (const file of imageFiles) {
    const mediumPath = path.join(mediumDir, file);
    const fullPath = path.join(fullDir, file);

    if (!fs.existsSync(mediumPath)) {
      await sharp(fullPath).resize({ width: 1200 }).toFile(mediumPath);
      console.log(`✅ Medium image generated: ${file}`);
    }
  }
})();
