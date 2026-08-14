import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'change-me-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  supportEmail: process.env.SUPPORT_EMAIL || 'soporte.acopio1@gmail.com',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'Acopio <noreply@acopio.local>',
  },
  database: {
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'acopio',
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: Number(process.env.DATABASE_PORT || 5432),
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    endpoint: process.env.R2_ENDPOINT || '',
    bucket: process.env.R2_BUCKET || 'acopio',
    prefix: (process.env.R2_PREFIX || 'images').replace(/^\/+|\/+$/g, ''),
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    publicUrl: (process.env.R2_PUBLIC_URL || '').replace(/\/+$/g, ''),
  },
};
