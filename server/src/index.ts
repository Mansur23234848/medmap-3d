import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { prisma } from './lib/core.js';
import { errorHandler } from './middleware/common.js';
import { authRouter } from './routes/auth.js';
import { patientRouter } from './routes/patient.js';
import { doctorRouter } from './routes/doctor.js';
import { adminRouter } from './routes/admin.js';
import { bodyAreasRouter, medicationsRouter, notificationsRouter, filesRouter, pharmacyRouter } from './routes/misc.js';

const app = express();
app.set('trust proxy', 'loopback');
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false }));
// Medical data must never be cached by browsers or proxies.
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/body-areas', bodyAreasRouter);
app.use('/api/patient', patientRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/pharmacy', pharmacyRouter);
app.use('/api/admin', adminRouter);
app.use('/api/medications', medicationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/files', filesRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'API маршруты табылмады' }));
app.use(errorHandler);

app.listen(env.port, () => console.log(`MEDMAP 3D API → http://localhost:${env.port}`));
