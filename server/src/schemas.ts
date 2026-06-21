import { z } from 'zod';
import { config } from './config.js';

export const shortcutSchema = z.object({
  key: z.string().trim().min(1).max(24),
  alt: z.boolean(),
  ctrl: z.boolean(),
  meta: z.boolean(),
  shift: z.boolean()
}).strict();

export const settingsSchema = z.object({
  theme: z.enum(['dark', 'light']),
  language: z.enum(['en', 'sl']),
  shortcuts: z.object({
    newChat: shortcutSchema,
    archived: shortcutSchema,
    settings: shortcutSchema
  }).strict()
}).strict();

export const messageSchema = z.object({
  id: z.string().min(1).max(128).optional(),
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().trim().min(1).max(4000),
  createdAt: z.number().finite().positive().optional(),
  order: z.number().int().nonnegative().max(config.MAX_MESSAGES_PER_CHAT - 1).optional(),
  error: z.boolean().optional()
}).strict();

export const chatIdSchema = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/);

export const migrationSchema = z.object({
  chats: z.array(z.object({
    id: chatIdSchema,
    title: z.string().trim().min(1).max(80),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
    createdAt: z.number().finite().positive().optional(),
    updatedAt: z.number().finite().positive().optional(),
    messages: z.array(messageSchema).max(config.MAX_MESSAGES_PER_CHAT)
  }).strict()).max(config.MAX_CHATS_PER_USER),
  settings: settingsSchema.optional()
}).strict();

export const chatMetadataSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional()
}).strict().refine((value) => Object.keys(value).length > 0);

export const chatRequestSchema = z.object({
  chatId: chatIdSchema,
  title: z.string().trim().min(1).max(80),
  isNew: z.boolean(),
  responseMessageId: z.string().min(1).max(128),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(4000)
  }).strict()).min(1).max(30),
  userMessage: messageSchema.extend({
    id: z.string().min(1).max(128),
    role: z.literal('user'),
    order: z.number().int().nonnegative().max(config.MAX_MESSAGES_PER_CHAT - 2)
  })
}).strict();

export type MigrationPayload = z.infer<typeof migrationSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type StoredMessage = z.infer<typeof messageSchema> & { id: string; order: number };
