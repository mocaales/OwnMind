import { Router } from 'express';
import { asyncRoute } from '../middleware.js';
import { userRefFor } from '../services/firestore-store.js';

export const authRouter = Router();

authRouter.get('/me', asyncRoute(async (req, res) => {
  const userRef = userRefFor(req.user.uid);
  const snapshot = await userRef.get();
  const profile = { uid: req.user.uid, email: req.user.email || '', name: req.user.name || '' };
  if (!snapshot.exists) await userRef.set({ ...profile, createdAt: new Date().toISOString() });
  const data = snapshot.exists ? (snapshot.data() || profile) : profile;
  res.json({ user: { uid: req.user.uid, email: data.email || profile.email, name: data.name || profile.name } });
}));
