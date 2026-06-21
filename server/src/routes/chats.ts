import { Router } from 'express';
import { z } from 'zod';
import { asyncRoute, chatLimiter, stateReadLimiter } from '../middleware.js';
import { chatIdSchema, chatMetadataSchema, messageSchema } from '../schemas.js';
import { deleteOwnedChat, getOwnedChat, loadChatMessages } from '../services/firestore-store.js';

export const chatsRouter = Router();

chatsRouter.get('/:chatId/messages', stateReadLimiter, asyncRoute(async (req, res) => {
  const chatId = chatIdSchema.safeParse(req.params.chatId);
  if (!chatId.success) return res.status(400).json({ error: 'Invalid chat id' });
  const messages = await loadChatMessages(req.user.uid, chatId.data);
  if (!messages) return res.status(404).json({ error: 'Chat not found' });
  return res.json({ messages });
}));

chatsRouter.patch('/:chatId', asyncRoute(async (req, res) => {
  const chatId = chatIdSchema.safeParse(req.params.chatId);
  const metadata = chatMetadataSchema.safeParse(req.body);
  if (!chatId.success || !metadata.success) return res.status(400).json({ error: 'Invalid chat update' });
  const owned = await getOwnedChat(req.user.uid, chatId.data);
  if (!owned) return res.status(404).json({ error: 'Chat not found' });
  await owned.ref.update({ ...metadata.data, updatedAt: Date.now() });
  return res.json({ updated: true });
}));

chatsRouter.delete('/:chatId', asyncRoute(async (req, res) => {
  const chatId = chatIdSchema.safeParse(req.params.chatId);
  if (!chatId.success) return res.status(400).json({ error: 'Invalid chat id' });
  if (!await deleteOwnedChat(req.user.uid, chatId.data)) return res.status(404).json({ error: 'Chat not found' });
  return res.json({ deleted: true });
}));

chatsRouter.post('/:chatId/messages', chatLimiter, asyncRoute(async (req, res) => {
  const chatId = chatIdSchema.safeParse(req.params.chatId);
  const message = messageSchema.extend({
    id: messageSchema.shape.id.unwrap(),
    order: messageSchema.shape.order.unwrap(),
    role: z.literal('assistant'),
    error: z.literal(true)
  }).strict().safeParse(req.body);
  if (!chatId.success || !message.success) return res.status(400).json({ error: 'Invalid message' });
  const owned = await getOwnedChat(req.user.uid, chatId.data);
  if (!owned) return res.status(404).json({ error: 'Chat not found' });
  const { id, ...messageData } = message.data;
  await Promise.all([
    owned.ref.collection('messages').doc(id).set(messageData),
    owned.ref.update({ updatedAt: messageData.createdAt || Date.now() })
  ]);
  return res.json({ message: { id, ...messageData } });
}));
