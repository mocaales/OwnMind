import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { authenticatedLimiter, errorHandler, noStore, notFound, publicApiLimiter, requestContext, requireAuth } from './middleware.js';
import { authRouter } from './routes/auth.js';
import { chatRouter } from './routes/chat.js';
import { chatsRouter } from './routes/chats.js';
import { stateRouter } from './routes/state.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.isProduction ? 1 : false);
app.use(requestContext);
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: config.isProduction ? [] : null
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use(cors({
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  origin(origin, callback) {
    callback(null, !origin || config.allowedOrigins.includes(origin));
  }
}));
app.use(express.json({ limit: '512kb', strict: true, type: 'application/json' }));

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', noStore, publicApiLimiter, requireAuth, authenticatedLimiter);
app.use('/api/auth', authRouter);
app.use('/api', stateRouter);
app.use('/api/chats', chatsRouter);
app.use('/api', chatRouter);
app.use('/api', notFound);

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { index: false, maxAge: config.isProduction ? '1h' : 0 }));
  app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
}

app.use(errorHandler);

export default app;
