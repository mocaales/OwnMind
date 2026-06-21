import { Router } from 'express';
import { asyncRoute, stateReadLimiter } from '../middleware.js';
import { migrationSchema, settingsSchema } from '../schemas.js';
import { loadApplicationState, migrateLocalState, settingsRefFor } from '../services/firestore-store.js';

export const stateRouter = Router();

stateRouter.get('/state', stateReadLimiter, asyncRoute(async (req, res) => {
  res.json(await loadApplicationState(req.user.uid));
}));

stateRouter.post('/migrate-local-state', asyncRoute(async (req, res) => {
  const parsed = migrationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid migration payload' });
  const migrated = await migrateLocalState(req.user.uid, parsed.data);
  return res.json({ migrated, reason: migrated ? undefined : 'already_migrated' });
}));

stateRouter.put('/settings', asyncRoute(async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid settings payload' });
  await settingsRefFor(req.user.uid).set({ ...parsed.data, updatedAt: Date.now() });
  return res.json({ settings: parsed.data });
}));
