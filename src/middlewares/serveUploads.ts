import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { uploadsRoot } from '../utils/uploads';
import {
  buildR2ObjectKey,
  getR2SignedGetUrl,
  isR2Configured,
} from '../utils/r2Storage';

export async function serveUploads(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const relativePath = decodeURIComponent(request.path).replace(/^\/+/, '');
    if (!relativePath || relativePath.includes('..')) {
      response.status(400).json({ message: 'Invalid file path' });
      return;
    }

    const absolutePath = path.resolve(uploadsRoot, relativePath);
    if (!absolutePath.startsWith(uploadsRoot)) {
      response.status(400).json({ message: 'Invalid file path' });
      return;
    }

    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      response.sendFile(absolutePath);
      return;
    }

    if (isR2Configured()) {
      const signedUrl = await getR2SignedGetUrl(buildR2ObjectKey(relativePath));
      response.redirect(302, signedUrl);
      return;
    }

    response.status(404).json({ message: 'File not found' });
  } catch (error) {
    next(error);
  }
}
