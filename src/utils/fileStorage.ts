import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import {
  buildPublicUploadUrl,
  ensureUploadDirectories,
  uploadsRoot,
} from './uploads';

ensureUploadDirectories();

function extensionFromMime(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

export async function saveAvatarFile(
  file: Express.Multer.File,
  idAcopioOrTemp: string | number
): Promise<{ relativePath: string; publicUrl: string }> {
  const extension = extensionFromMime(file.mimetype);
  const fileName = `avatar-${idAcopioOrTemp}-${Date.now()}.${extension}`;
  const absolutePath = path.join(uploadsRoot, 'avatars', fileName);

  await sharp(file.buffer)
    .rotate()
    .resize(512, 512, { fit: 'cover' })
    .toFormat(extension === 'png' ? 'png' : extension === 'webp' ? 'webp' : 'jpeg', {
      quality: 85,
    })
    .toFile(absolutePath);

  const relativePath = path.join('avatars', fileName).replace(/\\/g, '/');
  return {
    relativePath,
    publicUrl: buildPublicUploadUrl(relativePath),
  };
}

export async function saveAcopioGalleryImage(
  file: Express.Multer.File,
  idAcopio: number,
  sortOrder: number
): Promise<{ relativePath: string; publicUrl: string }> {
  const acopioDirectory = path.join(uploadsRoot, 'acopios', String(idAcopio));
  await fs.mkdir(acopioDirectory, { recursive: true });

  const extension = extensionFromMime(file.mimetype);
  const fileName = `image-${sortOrder}-${Date.now()}.${extension}`;
  const absolutePath = path.join(acopioDirectory, fileName);

  await sharp(file.buffer)
    .rotate()
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .toFormat(extension === 'png' ? 'png' : extension === 'webp' ? 'webp' : 'jpeg', {
      quality: 85,
    })
    .toFile(absolutePath);

  const relativePath = path
    .join('acopios', String(idAcopio), fileName)
    .replace(/\\/g, '/');

  return {
    relativePath,
    publicUrl: buildPublicUploadUrl(relativePath),
  };
}

export async function saveNeedQrFile(
  file: Express.Multer.File,
  idAcopio: number,
  idNeed: number
): Promise<{ relativePath: string; publicUrl: string }> {
  const acopioDirectory = path.join(uploadsRoot, 'acopios', String(idAcopio));
  await fs.mkdir(acopioDirectory, { recursive: true });

  const extension = extensionFromMime(file.mimetype);
  const fileName = `need-qr-${idNeed}-${Date.now()}.${extension}`;
  const absolutePath = path.join(acopioDirectory, fileName);

  await sharp(file.buffer)
    .rotate()
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .toFormat(extension === 'png' ? 'png' : extension === 'webp' ? 'webp' : 'jpeg', {
      quality: 85,
    })
    .toFile(absolutePath);

  const relativePath = path
    .join('acopios', String(idAcopio), fileName)
    .replace(/\\/g, '/');

  return {
    relativePath,
    publicUrl: buildPublicUploadUrl(relativePath),
  };
}

export async function deleteUploadFile(relativePath: string | null | undefined) {
  if (!relativePath) {
    return;
  }
  const absolutePath = path.join(uploadsRoot, relativePath);
  try {
    await fs.unlink(absolutePath);
  } catch {
    // ignore missing files
  }
}
