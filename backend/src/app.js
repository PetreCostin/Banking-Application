import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';
import env from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import accountsRoutes from './routes/accountsRoutes.js';
import transactionsRoutes from './routes/transactionsRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

const logger = pino({ level: env.nodeEnv === 'production' ? 'info' : 'debug' });
const app = express();

app.use(
  pinoHttp({
    logger,
    redact: {
      paths: ['req.headers.authorization', 'req.body.password', 'req.body.refreshToken'],
      remove: true,
    },
  }),
);
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    methods: ['GET', 'POST', 'DELETE'],
    credentials: false,
  }),
);
app.use(express.json({ limit: '100kb' }));

app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(
  '/api/auth',
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
