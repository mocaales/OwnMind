import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(10000),
  CLIENT_URL: z.string().min(1).default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(86_400_000).default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(10).max(10_000).default(200),
  CHAT_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(500).default(30),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).max(100).default('gpt-4.1-mini'),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(30_000),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  MAX_CHATS_PER_USER: z.coerce.number().int().min(1).max(1000).default(200),
  MAX_MESSAGES_PER_CHAT: z.coerce.number().int().min(10).max(2000).default(500)
}).passthrough();

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const names = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
  throw new Error(`Invalid or missing server configuration: ${names}`);
}

export const config = {
  ...parsed.data,
  allowedOrigins: parsed.data.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean),
  firebasePrivateKey: parsed.data.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  isProduction: parsed.data.NODE_ENV === 'production'
};
