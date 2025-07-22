import fs from 'fs/promises';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

async function renameFolder(req: NextApiRequest, res: NextApiResponse) {
  const { oldName, newName } = req.body;

  if (!oldName || !newName) {
    return res.status(400).json({ error: 'Missing oldName or newName' });
  }

  const base = path.join(process.cwd(), 'public/images/full');
  const oldPath = path.join(base, oldName);
  const newPath = path.join(base, newName);

  try {
    await fs.rename(oldPath, newPath);
    res.status(200).json({ message: 'Folder renamed successfully' });
  } catch (error) {
    console.error(`Error renaming folder ${oldName} to ${newName}:`, error);
    res.status(500).json({ error: 'Error renaming folder' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (req.method === 'POST') {
    if (!session || !session.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return await renameFolder(req, res);
  }

  const base = path.join(process.cwd(), 'public/images/full');
  try {
    const allFolderNames = await fs.readdir(base);
    const folderStats = await Promise.all(
      allFolderNames.map(async (f) => {
        try {
          const stat = await fs.stat(path.join(base, f));
          return { name: f, stat, isDirectory: stat.isDirectory() };
        } catch (error) {
          console.error(`Could not stat folder ${f}:`, error);
          return { name: f, stat: null, isDirectory: false };
        }
      })
    );

    const folders = folderStats
      .filter((f) => f.isDirectory)
      .sort((a, b) => {
        const aTime = a.stat?.mtime?.getTime?.() ?? 0;
        const bTime = b.stat?.mtime?.getTime?.() ?? 0;
        return bTime - aTime;
      })
      .map((f) => f.name);

    if (!folders || folders.length === 0) {
      // Fail-safe: log the directory contents and return a helpful message
      const dirContents = await fs.readdir(base);
      console.warn('No folders found in', base, 'Directory contents:', dirContents);
      return res.status(200).json({ folders: [], message: 'No folders found. Check directory structure and permissions.' });
    }

    res.status(200).json({ folders });
  } catch (error) {
    console.error('Error reading image directory:', error);
    res.status(500).json({ error: 'Error reading image directory' });
  }
}