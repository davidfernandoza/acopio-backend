import express from 'express';
import cors from 'cors';
import { appConfig } from './config/appConfig';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import geoRoutes from './routes/geoRoutes';
import acopioRoutes from './routes/acopioRoutes';
import contactRoutes from './routes/contactRoutes';
import { ensureUploadDirectories } from './utils/uploads';
import { serveUploads } from './middlewares/serveUploads';
import { isR2Configured } from './utils/r2Storage';

ensureUploadDirectories();

if (!isR2Configured()) {
  console.warn(
    'Cloudflare R2 is not configured. Images will be stored locally until R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are set.'
  );
}

const app = express();

const allowedOrigins = Array.from(
  new Set(
    [appConfig.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean)
  )
);

app.use(
  cors({
    origin(requestOrigin, callback) {
      if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', serveUploads);

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/', geoRoutes);
app.use('/acopios', acopioRoutes);
app.use('/contact', contactRoutes);

app.use(errorHandler);

export default app;
