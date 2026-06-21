import { randomUUID } from 'crypto';
import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import rateLimit, { type Options } from 'express-rate-limit';
import { auth } from './firebase-admin.js';
import { config } from './config.js';

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

export function noStore(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store');
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = header.slice(7);
  if (!token || token.length > 8192) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = await auth.verifyIdToken(token, true);
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

const limiterOptions: Partial<Options> = {
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => res.status(429).json({ error: 'Too many requests. Try again later.' })
};

export const publicApiLimiter = rateLimit({ ...limiterOptions, limit: config.RATE_LIMIT_MAX_REQUESTS });
export const authenticatedLimiter = rateLimit({ ...limiterOptions, limit: config.RATE_LIMIT_MAX_REQUESTS, keyGenerator: (req) => req.user.uid });
export const chatLimiter = rateLimit({ ...limiterOptions, limit: config.CHAT_RATE_LIMIT_MAX, keyGenerator: (req) => req.user.uid });
export const stateReadLimiter = rateLimit({ ...limiterOptions, limit: 60, keyGenerator: (req) => req.user.uid });

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;
export const asyncRoute = (handler: AsyncHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

interface HttpBodyError extends Error { type?: string }

export const errorHandler: ErrorRequestHandler = (error: HttpBodyError, req, res, _next) => {
  if (res.headersSent) return;
  if (error?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large', requestId: req.requestId });
    return;
  }
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON body', requestId: req.requestId });
    return;
  }
  console.error(`[${req.requestId}] Unhandled request error`, error);
  res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
};
