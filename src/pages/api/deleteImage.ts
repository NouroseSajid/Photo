import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]'; // Import your authOptions
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'DELETE') {
    const { imageNames } = req.body;

    if (!imageNames || !Array.isArray(imageNames) || imageNames.length === 0) {
      return res.status(400).json({ error: 'Image names are required' });
    }

    const errors: string[] = [];

    for (const imageName of imageNames) {
      const filesToDelete = [
        path.join(process.cwd(), 'public', 'images', 'full', imageName),
        path.join(process.cwd(), 'public', 'images', 'medium', imageName),
        path.join(process.cwd(), 'public', 'images', 'thumbs', imageName),
      ];

      for (const filePath of filesToDelete) {
        try {
          await fs.unlink(filePath);
          console.log(`Successfully deleted: ${filePath}`);
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            console.warn(`File not found, skipping: ${filePath}`);
          } else {
            console.error(`Failed to delete ${filePath}:`, error);
            errors.push(`Failed to delete ${imageName}: ${error.message}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(500).json({ error: 'Some images could not be deleted', details: errors });
    } else {
      return res.status(200).json({ message: 'Images deleted successfully' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
