import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { imageNames, targetFolder } = req.body;

    if (!imageNames || !Array.isArray(imageNames) || imageNames.length === 0 || !targetFolder) {
      return res.status(400).json({ error: 'Image names and target folder are required.' });
    }

    const baseDir = path.join(process.cwd(), 'public', 'images');
    const imageTypes = ['full', 'medium', 'thumbs'];
    const errors: string[] = [];

    for (const image of imageNames) {
      const { filename, folder: currentFolder } = image;

      if (currentFolder === targetFolder) {
        errors.push(`Image ${filename} is already in the target folder ${targetFolder}.`);
        continue;
      }

      for (const type of imageTypes) {
        const oldPath = path.join(baseDir, type, currentFolder, filename);
        const newPath = path.join(baseDir, type, targetFolder, filename);

        try {
          // Ensure target folder exists
          await fs.mkdir(path.dirname(newPath), { recursive: true });
          await fs.rename(oldPath, newPath);
          console.log(`Successfully moved ${oldPath} to ${newPath}`);
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            console.warn(`File ${oldPath} not found for type ${type}, skipping move.`);
          } else {
            console.error(`Failed to move ${oldPath} to ${newPath}:`, error);
            errors.push(`Failed to move ${filename} in ${type}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(500).json({ error: 'Some images could not be moved.', details: errors });
    } else {
      return res.status(200).json({ message: 'Images moved successfully.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
