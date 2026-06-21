import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { config } from '../config.js';

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_BASE_URL,
  timeout: config.OPENAI_TIMEOUT_MS,
  maxRetries: 1
});

export async function generateReply(messages: ChatCompletionMessageParam[]): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: config.OPENAI_MODEL,
    messages,
    max_tokens: 500,
    temperature: 0.7
  });
  return completion.choices?.[0]?.message?.content?.trim() || 'No response.';
}
