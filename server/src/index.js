import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import OpenAI from 'openai';
import { auth, db } from './firebase-admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const publicDir = path.join(__dirname, '../public');

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 200),
  standardHeaders: true,
  legacyHeaders: false
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = header.slice(7);
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    const snap = await userRef.get();

    const profile = {
      uid: req.user.uid,
      email: req.user.email || '',
      name: req.user.name || ''
    };

    if (!snap.exists) {
      await userRef.set({ ...profile, createdAt: new Date().toISOString() });
      return res.json({ user: profile });
    }

    const data = snap.data();
    return res.json({
      user: {
        uid: req.user.uid,
        email: data?.email || profile.email,
        name: data?.name || profile.name
      }
    });
  } catch {
    return res.status(500).json({ error: 'Unable to load profile' });
  }
});

app.post('/api/chat', requireAuth, async (req, res) => {
  const schema = z.object({
    messages: z.array(z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string().min(1).max(4000) })).min(1).max(30)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid message payload' });

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: parsed.data.messages,
      max_tokens: 500,
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || 'No response.';

    await db
      .collection('users')
      .doc(req.user.uid)
      .collection('chats')
      .add({
        messages: parsed.data.messages,
        reply,
        createdAt: new Date().toISOString()
      });

    return res.json({ reply });
  } catch {
    return res.status(502).json({ error: 'LLM request failed' });
  }
});

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
}

const port = Number(process.env.PORT || 10000);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
