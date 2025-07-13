import type { NextApiRequest, NextApiResponse } from 'next';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';

// Required for large files (disable 4MB default API limit)
export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const filesParam = req.query.files;

  if (!filesParam || typeof filesParam !== 'string') {
    return res.status(400).json({ error: 'Missing ?files=filename1.jpg,filename2.jpg' });
  }

  const filenames = filesParam.split(',');
  const archive = archiver('zip', { zlib: { level: 9 } });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="gallery.zip"');

  archive.pipe(res);

  filenames.forEach((filename) => {
    const fullPath = path.join(process.cwd(), 'public/images/full', filename);

    if (fs.existsSync(fullPath)) {
      archive.file(fullPath, { name: filename });
    } else {
      console.warn(`❌ File not found: ${filename}`);
    }
  });

  archive.finalize();
}
