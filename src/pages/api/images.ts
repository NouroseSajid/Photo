import fs from 'fs/promises';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';

export type GalleryMedia = {
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
  mediaType: 'image' | 'video';
};

const imageExtensions = /\.(jpe?g|png|webp)$/i;
const videoExtensions = /\.(mp4|webm|mov|avi|mkv)$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const imageBase = path.join(process.cwd(), 'public/images/full');
  const videoBase = path.join(process.cwd(), 'public/clips/full');
  const page = Number(req.query.page ?? 0);
  const folder = req.query.folder as string | undefined;

  try {
    const readMedia = async (basePath: string, mediaType: 'image' | 'video') => {
      let foldersToRead: string[];
      if (folder) {
        foldersToRead = [folder];
      } else {
        const entries = await fs.readdir(basePath, { withFileTypes: true });
        foldersToRead = entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
      }

      const allFiles = [];
      for (const f of foldersToRead) {
        const fullDir = path.join(basePath, f);
        const fileNames = await fs.readdir(fullDir);
        const fileStats = await Promise.all(
          fileNames
            .filter((file) => (mediaType === 'image' ? imageExtensions : videoExtensions).test(file))
            .map(async (file) => {
              try {
                const stat = await fs.stat(path.join(fullDir, file));
                return { filename: file, modified: stat.mtime.getTime(), folder: f, mediaType };
              } catch (error) {
                console.error(`Could not stat file ${file}:`, error);
                return null;
              }
            })
        );
        allFiles.push(...fileStats.filter((file) => file !== null) as { filename: string; modified: number; folder: string; mediaType: 'image' | 'video' }[]);
      }
      return allFiles;
    };

    const allMedia = (await Promise.all([
      readMedia(imageBase, 'image'),
      readMedia(videoBase, 'video'),
    ])).flat();

    allMedia.sort((a, b) => b.modified - a.modified);

    const start = page * 50;
    const end = start + 50;
    const files = allMedia.slice(start, end);

    const media = await Promise.all(
      files.map(async (f) => {
        const originalPath = path.join(f.mediaType === 'image' ? imageBase : videoBase, f.folder, f.filename);
        let width = 400,
          height = 300;
        if (f.mediaType === 'image') {
          try {
            const meta = await sharp(originalPath).metadata();
            width = meta.width ?? width;
            height = meta.height ?? height;
          } catch (error) {
            console.error(`Failed to get metadata for ${f.filename}:`, error);
          }
        }

        const isNew = Date.now() - f.modified < 24 * 60 * 60 * 1000; // 24 hours

        return {
          filename: f.filename,
          modified: f.modified,
          folder: f.folder,
          isNew,
          thumbnailUrl: f.mediaType === 'image' ? `/images/thumbs/${f.folder}/${f.filename}` : `/clips/thumbs/${f.folder}/${path.parse(f.filename).name}.png`,
          fullUrl: f.mediaType === 'image' ? `/images/full/${f.folder}/${f.filename}` : `/clips/full/${f.folder}/${f.filename}`,
          mediumUrl: f.mediaType === 'image' ? `/images/medium/${f.folder}/${f.filename}` : `/clips/medium/${f.folder}/${path.parse(f.filename).name}.png`,
          width,
          height,
          mediaType: f.mediaType,
        };
      })
    );

    res.status(200).json({ images: media, total: allMedia.length });
  } catch (error) {
    console.error('Error reading media directory:', error);
    res.status(500).json({ error: 'Error reading media directory' });
  }
}