import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export type GalleryImage = {
  filename: string;
  thumbnailUrl: string;
  fullUrl: string;
  mediumUrl: string;
  modified: number;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const start = (page - 1) * limit;

  const fullDir = path.join(process.cwd(), 'public/images/full');
  const files = fs.readdirSync(fullDir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .map(f => ({
      filename: f,
      modified: fs.statSync(path.join(fullDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.modified - a.modified);

  const paginated = files.slice(start, start + limit).map(f => ({
    filename: f.filename,
    modified: f.modified,
    thumbnailUrl: `/images/thumbs/${f.filename}`,
    fullUrl: `/images/full/${f.filename}`,
    mediumUrl: `/images/medium/${f.filename}`
  }));

  res.status(200).json({
    images: paginated,
    page,
    total: files.length
  });
}
