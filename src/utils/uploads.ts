import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Request } from 'express';
import { HttpError } from '../middlewares/errorHandler';
import { appConfig } from '../config/appConfig';

export const uploadsRoot = path.resolve(process.cwd(), 'uploads');
export const maxAcopioGalleryImages = 7;

export function ensureUploadDirectories() {
  const directories = [
    uploadsRoot,
    path.join(uploadsRoot, 'avatars'),
    path.join(uploadsRoot, 'acopios'),
  ];
  for (const directoryPath of directories) {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  }
}

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function fileFilter(
  _request: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new HttpError(400, 'Only jpeg, png and webp images are allowed'));
    return;
  }
  callback(null, true);
}

const memoryStorage = multer.memoryStorage();

const needQrFields = Array.from({ length: 20 }, (_unused, needIndex) => ({
  name: `needQr_${needIndex}`,
  maxCount: 1 as const,
}));

export const createAcopioUploadFields = [
  { name: 'avatar', maxCount: 1 },
  { name: 'images', maxCount: maxAcopioGalleryImages },
  ...needQrFields,
];

export const uploadAcopioMedia = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 32,
  },
  fileFilter,
});

function excelFileFilter(
  _request: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) {
  const originalName = file.originalname.toLowerCase();
  const hasExcelExtension = originalName.endsWith('.xlsx') || originalName.endsWith('.xls');
  if (!hasExcelExtension) {
    callback(new HttpError(400, 'Only Excel files (.xlsx) are allowed'));
    return;
  }
  callback(null, true);
}

export const uploadExcelFile = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: excelFileFilter,
});

export function buildPublicUploadUrl(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  const r2PublicUrl = appConfig.r2.publicUrl;
  const r2Prefix = appConfig.r2.prefix;
  if (r2PublicUrl && (!r2Prefix || normalized === r2Prefix || normalized.startsWith(`${r2Prefix}/`))) {
    return `${r2PublicUrl}/${normalized}`;
  }

  return `/uploads/${normalized}`;
}

export function buildInitialsAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=1f6f5b&color=fff&size=256&bold=true`;
}
