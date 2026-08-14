import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { appConfig } from '../config/appConfig';

const signedUrlExpiresInSeconds = 60 * 60;

let r2Client: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    appConfig.r2.endpoint &&
      appConfig.r2.bucket &&
      appConfig.r2.accessKeyId &&
      appConfig.r2.secretAccessKey
  );
}

function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 is not configured');
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: appConfig.r2.endpoint,
      credentials: {
        accessKeyId: appConfig.r2.accessKeyId,
        secretAccessKey: appConfig.r2.secretAccessKey,
      },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  return r2Client;
}

export function buildR2ObjectKey(relativePath: string): string {
  const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const prefix = appConfig.r2.prefix;

  if (!prefix || normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) {
    return normalizedPath;
  }

  return `${prefix}/${normalizedPath}`;
}

export async function uploadR2Object(
  objectKey: string,
  fileBuffer: Buffer,
  mimeType: string
) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: appConfig.r2.bucket,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
}

export async function deleteR2Object(objectKey: string) {
  if (!isR2Configured() || !objectKey) {
    return;
  }

  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: appConfig.r2.bucket,
        Key: objectKey,
      })
    );
  } catch {
    // ignore missing remote files
  }
}

export async function getR2SignedGetUrl(objectKey: string): Promise<string> {
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: appConfig.r2.bucket,
      Key: objectKey,
    }),
    { expiresIn: signedUrlExpiresInSeconds }
  );
}

export function buildR2PublicUrl(objectKey: string): string | null {
  if (!appConfig.r2.publicUrl) {
    return null;
  }

  return `${appConfig.r2.publicUrl}/${objectKey}`;
}
