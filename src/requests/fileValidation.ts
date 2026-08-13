import { Request } from 'express';
import { HttpError } from '../middlewares/errorHandler';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function assertValidImageFile(file: Express.Multer.File | undefined, fieldName: string) {
  if (!file) {
    throw new HttpError(400, `${fieldName} is required`);
  }
  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new HttpError(400, `${fieldName} must be jpeg, png or webp`);
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new HttpError(400, `${fieldName} must be at most 5MB`);
  }
}

export function assertOptionalImageFile(file: Express.Multer.File | undefined, fieldName: string) {
  if (!file) {
    return;
  }
  assertValidImageFile(file, fieldName);
}

export function assertImageFiles(files: Express.Multer.File[] | undefined, maxCount: number) {
  const imageFiles = files || [];
  if (imageFiles.length > maxCount) {
    throw new HttpError(400, `At most ${maxCount} images are allowed`);
  }
  for (const file of imageFiles) {
    assertValidImageFile(file, file.fieldname || 'image');
  }
}

export function getUploadedFiles(request: Request): {
  avatar?: Express.Multer.File;
  images: Express.Multer.File[];
  qr?: Express.Multer.File;
  needQrByIndex: Record<number, Express.Multer.File>;
} {
  const singleFile = request.file as Express.Multer.File | undefined;
  const files = request.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | Express.Multer.File[]
    | undefined;

  const needQrByIndex: Record<number, Express.Multer.File> = {};

  if (!files && !singleFile) {
    return { images: [], needQrByIndex };
  }

  if (Array.isArray(files)) {
    return { images: files, qr: singleFile, needQrByIndex };
  }

  if (files) {
    for (const [fieldName, fieldFiles] of Object.entries(files)) {
      const qrIndexMatch = fieldName.match(/^needQr_(\d+)$/);
      if (qrIndexMatch && fieldFiles[0]) {
        needQrByIndex[Number(qrIndexMatch[1])] = fieldFiles[0];
      }
    }
  }

  return {
    avatar: files?.avatar?.[0],
    images: files?.images || [],
    qr: singleFile || files?.qr?.[0],
    needQrByIndex,
  };
}
