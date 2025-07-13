import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';

export type GalleryImage = {
  filename: string;
  thumbnailUrl: string;
  fullUrl: string;
  mediumUrl: string;
  modified: number;
  width: number;
  height: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // No pagination: return all images

  const fullDir = path.join(process.cwd(), 'public/images/full');
  const thumbDir = path.join(process.cwd(), 'public/images/thumbs');

  const files = fs.readdirSync(fullDir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .map(f => ({
      filename: f,
      modified: fs.statSync(path.join(fullDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.modified - a.modified);

  const paginatedFiles = files; // All files

  const images = await Promise.all(paginatedFiles.map(async (f) => {
    const thumbPath = path.join(thumbDir, f.filename);
    const originalPath = path.join(fullDir, f.filename); // Path to the original image
    let width = 400, height = 300; // Default values
    try {
      const metadata = await sharp(originalPath).metadata(); // Read metadata from original
      width = metadata.width || width;
      height = metadata.height || height;
    } catch (e) {
      console.error(`Could not read metadata for ${f.filename}:`, e);
    }

    return {
      filename: f.filename,
      modified: f.modified,
      thumbnailUrl: `/images/thumbs/${f.filename}`,
      fullUrl: `/images/full/${f.filename}`,
      mediumUrl: `/images/medium/${f.filename}`,
      width,
      height
    };
  }));

  res.status(200).json({
    images,
    total: files.length
  });
}
