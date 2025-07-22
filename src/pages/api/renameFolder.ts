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
    const { oldFolderName, newFolderName } = req.body;

    if (!oldFolderName || !newFolderName) {
      return res.status(400).json({ error: 'Old and new folder names are required.' });
    }

    if (oldFolderName === newFolderName) {
      return res.status(400).json({ error: 'New folder name cannot be the same as the old folder name.' });
    }

    const baseDir = path.join(process.cwd(), 'public', 'images');
    const imageTypes = ['full', 'medium', 'thumbs'];
    const errors: string[] = [];

    for (const type of imageTypes) {
      const oldPath = path.join(baseDir, type, oldFolderName);
      const newPath = path.join(baseDir, type, newFolderName);

      try {
        // Check if old folder exists
        await fs.access(oldPath);
        await fs.rename(oldPath, newPath);
        console.log(`Successfully renamed ${oldPath} to ${newPath}`);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.warn(`Folder ${oldPath} not found for type ${type}, skipping rename.`);
        } else {
          console.error(`Failed to rename folder ${oldPath} to ${newPath}:`, error);
          errors.push(`Failed to rename ${oldFolderName} in ${type}: ${error.message}`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(500).json({ error: 'Some folders could not be renamed.', details: errors });
    } else {
      return res.status(200).json({ message: 'Folder renamed successfully.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
