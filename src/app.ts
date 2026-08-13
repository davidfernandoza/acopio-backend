import express from 'express';
import cors from 'cors';
import { appConfig } from './config/appConfig';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import geoRoutes from './routes/geoRoutes';
import acopioRoutes from './routes/acopioRoutes';
import contactRoutes from './routes/contactRoutes';
import { ensureUploadDirectories, uploadsRoot } from './utils/uploads';

ensureUploadDirectories();

const app = express();

app.use(
  cors({
    origin: appConfig.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(uploadsRoot));

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/', geoRoutes);
app.use('/acopios', acopioRoutes);
app.use('/contact', contactRoutes);

app.use(errorHandler);

export default app;
