import fs from 'fs/promises';
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
  folder: string;
  isNew: boolean;
  blurDataURL?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const base = path.join(process.cwd(), 'public/images/full');
  const page = Number(req.query.page ?? 0);
  const folder = req.query.folder as string | undefined;

  try {
    const foldersToRead = folder ? [folder] : await fs.readdir(base);

    const allFiles = [];
    for (const f of foldersToRead) {
      const fullDir = path.join(base, f);
      const fileNames = await fs.readdir(fullDir);
      const fileStats = await Promise.all(
        fileNames
          .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
          .map(async (file) => {
            try {
              const stat = await fs.stat(path.join(fullDir, file));
              return { filename: file, modified: stat.mtime.getTime(), folder: f };
            } catch (error) {
              console.error(`Could not stat file ${file}:`, error);
              return null;
            }
          })
      );
      allFiles.push(...fileStats.filter((file) => file !== null) as { filename: string; modified: number; folder: string; }[]);
    }

    allFiles.sort((a, b) => b.modified - a.modified);

    const start = page * 50;
    const end = start + 50;
    const files = allFiles.slice(start, end);

    const images = await Promise.all(
      files.map(async (f) => {
        const originalPath = path.join(base, f.folder, f.filename);
        let width = 400,
          height = 300;
        try {
          const meta = await sharp(originalPath).metadata();
          width = meta.width ?? width;
          height = meta.height ?? height;
        } catch (error) {
          console.error(`Failed to get metadata for ${f.filename}:`, error);
        }

        const isNew = Date.now() - f.modified < 24 * 60 * 60 * 1000; // 24 hours

        return {
          filename: f.filename,
          modified: f.modified,
          folder: f.folder,
          isNew,
          thumbnailUrl: `/images/thumbs/${f.folder}/${f.filename}`,
          fullUrl: `/images/full/${f.folder}/${f.filename}`,
          mediumUrl: `/images/medium/${f.folder}/${f.filename}`,
          width,
          height,
        };
      })
    );

    res.status(200).json({ images, total: allFiles.length });
  } catch (error) {
    console.error('Error reading image directory:', error);
    res.status(500).json({ error: 'Error reading image directory' });
  }
}