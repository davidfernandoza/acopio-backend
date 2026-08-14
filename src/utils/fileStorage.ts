import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import {
  buildPublicUploadUrl,
  ensureUploadDirectories,
  uploadsRoot,
} from './uploads';
import {
  buildR2ObjectKey,
  deleteR2Object,
  isR2Configured,
  uploadR2Object,
} from './r2Storage';

ensureUploadDirectories();

function extensionFromMime(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function mimeTypeFromExtension(extension: string): string {
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}

async function processImageBuffer(
  file: Express.Multer.File,
  resize: {
    width: number;
    height: number;
    fit: 'cover' | 'inside';
    withoutEnlargement?: boolean;
  }
): Promise<{ fileBuffer: Buffer; extension: string; mimeType: string }> {
  const extension = extensionFromMime(file.mimetype);
  const mimeType = mimeTypeFromExtension(extension);

  const processedBuffer = await sharp(file.buffer)
    .rotate()
    .resize(resize.width, resize.height, {
      fit: resize.fit,
      withoutEnlargement: resize.withoutEnlargement,
    })
    .toFormat(extension === 'png' ? 'png' : extension === 'webp' ? 'webp' : 'jpeg', {
      quality: 85,
    })
    .toBuffer();

  return {
    fileBuffer: processedBuffer,
    extension,
    mimeType,
  };
}

async function persistProcessedFile(
  relativePath: string,
  fileBuffer: Buffer,
  mimeType: string
) {
  if (isR2Configured()) {
    await uploadR2Object(relativePath, fileBuffer, mimeType);
    return;
  }

  const absolutePath = path.join(uploadsRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, fileBuffer);
}

export async function saveAvatarFile(
  file: Express.Multer.File,
  idAcopioOrTemp: string | number
): Promise<{ relativePath: string; publicUrl: string }> {
  const { fileBuffer, extension, mimeType } = await processImageBuffer(file, {
    width: 512,
    height: 512,
    fit: 'cover',
  });
  const fileName = `avatar-${idAcopioOrTemp}-${Date.now()}.${extension}`;
  const relativePath = buildR2ObjectKey(path.join('avatars', fileName).replace(/\\/g, '/'));

  await persistProcessedFile(relativePath, fileBuffer, mimeType);

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
  const { fileBuffer, extension, mimeType } = await processImageBuffer(file, {
    width: 1600,
    height: 1600,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const fileName = `image-${sortOrder}-${Date.now()}.${extension}`;
  const relativePath = buildR2ObjectKey(
    path.join('acopios', String(idAcopio), fileName).replace(/\\/g, '/')
  );

  await persistProcessedFile(relativePath, fileBuffer, mimeType);

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
  const { fileBuffer, extension, mimeType } = await processImageBuffer(file, {
    width: 1200,
    height: 1200,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const fileName = `need-qr-${idNeed}-${Date.now()}.${extension}`;
  const relativePath = buildR2ObjectKey(
    path.join('acopios', String(idAcopio), fileName).replace(/\\/g, '/')
  );

  await persistProcessedFile(relativePath, fileBuffer, mimeType);

  return {
    relativePath,
    publicUrl: buildPublicUploadUrl(relativePath),
  };
}

export async function deleteUploadFile(relativePath: string | null | undefined) {
  if (!relativePath) {
    return;
  }

  const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');

  if (isR2Configured()) {
    await deleteR2Object(buildR2ObjectKey(normalizedPath));
  }

  const absolutePath = path.join(uploadsRoot, normalizedPath);
  try {
    await fs.unlink(absolutePath);
  } catch {
    // ignore missing local files
  }
}
