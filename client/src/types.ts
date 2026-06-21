export type AuthMode = 'login' | 'register';
export type Theme = 'dark' | 'light';
export type Language = 'en' | 'sl';
export type MessageRole = 'user' | 'assistant';
export type ShortcutName = 'newChat' | 'archived' | 'settings';

export interface AuthPayload {
  name: string;
  email: string;
  password: string;
}

export interface AppUser {
  uid?: string;
  email: string;
  name: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  order: number;
  error?: boolean;
  ephemeral?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  messagesLoaded: boolean;
}

export interface Shortcut {
  key: string;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

export type Shortcuts = Record<ShortcutName, Shortcut>;

export interface Preferences {
  theme: Theme;
  language: Language;
  shortcuts: Shortcuts;
}
