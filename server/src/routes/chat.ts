import { Router } from 'express';
import { asyncRoute, chatLimiter } from '../middleware.js';
import { chatRequestSchema } from '../schemas.js';
import { chatsRefFor, enforceChatCapacity, getOwnedChat } from '../services/firestore-store.js';
import { generateReply } from '../services/llm.js';

export const chatRouter = Router();

chatRouter.post('/chat', chatLimiter, asyncRoute(async (req, res) => {
  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid message payload' });
  const { chatId, title, isNew, responseMessageId, messages, userMessage } = parsed.data;
  const chatRef = chatsRefFor(req.user.uid).doc(chatId);

  if (isNew) {
    if (!await enforceChatCapacity(req.user.uid)) return res.status(409).json({ error: 'Chat limit reached' });
  } else if (!await getOwnedChat(req.user.uid, chatId)) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  await Promise.all([
    chatRef.set(isNew
      ? { schemaVersion: 2, title, pinned: false, archived: false, createdAt: userMessage.createdAt || Date.now(), updatedAt: Date.now() }
      : { title, updatedAt: Date.now() }, { merge: true }),
    chatRef.collection('messages').doc(userMessage.id).set({ role: 'user', content: userMessage.content, createdAt: userMessage.createdAt || Date.now(), order: userMessage.order, error: false })
  ]);

  let assistantMessage;
  let modelFailed = false;
  try {
    const reply = await generateReply(messages);
    assistantMessage = { id: responseMessageId, role: 'assistant', content: reply, createdAt: Date.now(), order: userMessage.order + 1, error: false };
  } catch (error) {
    console.error(`[${req.requestId}] Model request failed`, error instanceof Error ? error.message : error);
    modelFailed = true;
    assistantMessage = { id: responseMessageId, role: 'assistant', content: 'I couldn’t complete that request. LLM request failed', createdAt: Date.now(), order: userMessage.order + 1, error: true };
  }

  const { id, ...messageData } = assistantMessage;
  await Promise.all([
    chatRef.collection('messages').doc(id).set(messageData),
    chatRef.update({ updatedAt: assistantMessage.createdAt })
  ]);
  if (modelFailed) return res.status(502).json({ error: 'LLM request failed', message: assistantMessage });
  return res.json({ reply: assistantMessage.content, message: assistantMessage });
}));
