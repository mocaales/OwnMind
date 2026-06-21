import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { createApiClient } from '../services/api';
import type { AppUser, Chat, Language, Message, Preferences, Shortcut, ShortcutName, Shortcuts, Theme } from '../types';

type IconName = 'compose' | 'plus' | 'search' | 'archive' | 'more' | 'pin' | 'edit' | 'trash' | 'settings' | 'logout' | 'arrow' | 'menu' | 'close' | 'check' | 'globe' | 'sun' | 'keyboard';

const Icon = ({ name, size = 18 }: { name: IconName; size?: number }) => {
  const paths: Record<IconName, ReactNode> = {
    compose: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    archive: <><path d="M3 6h18M5 6v14h14V6M9 10h6"/><path d="M4 3h16v3H4z"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></>,
    pin: <><path d="m14 4 6 6-3 1-4 4-1 5-2-2-2-2-2-2 5-1 4-4Z"/><path d="m5 19 4-4"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5"/></>,
    arrow: <><path d="M12 19V5M6 11l6-6 6 6"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/></>,
    keyboard: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01M11 9h.01M15 9h.01M18 9h.01M7 13h.01M11 13h.01M15 13h3M7 16h10"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const copy = {
  en: {
    newChat: 'New chat', search: 'Search chats', archived: 'Archived chats', chats: 'Chats', empty: 'Your conversations will appear here.',
    settings: 'Settings', general: 'General', appearance: 'Appearance', language: 'Language', dark: 'Dark', light: 'Light',
    operational: 'All systems operational', welcome: 'Good to see you', ready: 'Ready when you are.', prompt: 'What would you like to work on?',
    placeholder: 'Message GeNNio', note: 'GeNNio can make mistakes. Check important information.', you: 'You', account: 'Your account', logout: 'Log out',
    pinned: 'Pin', unpinned: 'Unpin', rename: 'Rename', archiveAction: 'Archive', restore: 'Restore', delete: 'Delete', archivedEmpty: 'No archived conversations.',
    renameTitle: 'Rename conversation', renameHint: 'Enter a new name for this conversation.', cancel: 'Cancel', save: 'Save', deleteTitle: 'Delete conversation?', deleteHint: 'This conversation will be permanently deleted. This action cannot be undone.', deleteConfirm: 'Delete forever',
    searchPlaceholder: 'Search conversations', recent: 'Recent', noResults: 'No conversations found', today: 'Today', yesterday: 'Yesterday', archivedTag: 'Archived',
    shortcuts: 'Shortcuts', shortcutHint: 'Click a shortcut, then press your preferred key combination.', shortcutNew: 'Create a new chat', shortcutArchived: 'Open archived chats', shortcutSettings: 'Open settings',
    pressShortcut: 'Press keys…', shortcutModifier: 'Include Ctrl, Alt, or ⌘.', shortcutConflict: 'That shortcut is already in use.'
  },
  sl: {
    newChat: 'Nov pogovor', search: 'Iskanje pogovorov', archived: 'Arhivirani pogovori', chats: 'Pogovori', empty: 'Vaši pogovori se bodo prikazali tukaj.',
    settings: 'Nastavitve', general: 'Splošno', appearance: 'Videz', language: 'Jezik', dark: 'Temno', light: 'Svetlo',
    operational: 'Vsi sistemi delujejo', welcome: 'Lepo te je videti', ready: 'Pripravljen, ko ste vi.', prompt: 'Na čem želite delati?',
    placeholder: 'Sporočilo za GeNNio', note: 'GeNNio se lahko zmoti. Pomembne informacije preverite.', you: 'Vi', account: 'Vaš račun', logout: 'Odjava',
    pinned: 'Pripni', unpinned: 'Odpni', rename: 'Preimenuj', archiveAction: 'Arhiviraj', restore: 'Obnovi', delete: 'Izbriši', archivedEmpty: 'Ni arhiviranih pogovorov.',
    renameTitle: 'Preimenuj pogovor', renameHint: 'Vnesite novo ime za ta pogovor.', cancel: 'Prekliči', save: 'Shrani', deleteTitle: 'Izbrišem pogovor?', deleteHint: 'Ta pogovor bo trajno izbrisan. Tega dejanja ni mogoče razveljaviti.', deleteConfirm: 'Trajno izbriši',
    searchPlaceholder: 'Iščite pogovore', recent: 'Nedavno', noResults: 'Ni najdenih pogovorov', today: 'Danes', yesterday: 'Včeraj', archivedTag: 'Arhivirano',
    shortcuts: 'Bližnjice', shortcutHint: 'Kliknite bližnjico in nato pritisnite želeno kombinacijo tipk.', shortcutNew: 'Ustvari nov pogovor', shortcutArchived: 'Odpri arhivirane pogovore', shortcutSettings: 'Odpri nastavitve',
    pressShortcut: 'Pritisnite tipke…', shortcutModifier: 'Vključite Ctrl, Alt ali ⌘.', shortcutConflict: 'Ta bližnjica je že v uporabi.'
  }
} as const;

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
};

const applePlatform = /Mac|iPhone|iPad/.test(navigator.platform);
const defaultShortcuts: Shortcuts = {
  newChat: { key: 'n', alt: !applePlatform, ctrl: applePlatform, meta: false, shift: false },
  archived: { key: 'a', alt: !applePlatform, ctrl: applePlatform, meta: false, shift: applePlatform },
  settings: { key: ',', alt: false, ctrl: !applePlatform, meta: applePlatform, shift: false }
};

const matchesShortcut = (event: KeyboardEvent, shortcut: Shortcut) => event.key.toLowerCase() === shortcut.key
  && event.altKey === shortcut.alt && event.ctrlKey === shortcut.ctrl
  && event.metaKey === shortcut.meta && event.shiftKey === shortcut.shift;

const sameShortcut = (first: Shortcut, second: Shortcut) => first.key === second.key && first.alt === second.alt
  && first.ctrl === second.ctrl && first.meta === second.meta && first.shift === second.shift;

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 4;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : 'Request failed';

interface ChatUIProps {
  user: AppUser;
  getToken: () => Promise<string>;
  onLogout: () => Promise<void>;
}

interface ActionMenuState {
  chatId: string;
  left: number;
  top: number;
}

interface DialogState {
  type: 'rename' | 'delete';
  chatId: string;
}

interface ApplicationStateResponse {
  chats: Chat[];
  settings: Preferences | null;
}

export default function ChatUI({ user, getToken, onLogout }: ChatUIProps) {
  const legacyStorageKey = `gennio-chats:${user.email || 'local'}`;
  const [chats, setChats] = useState<Chat[]>([]);
  const [stateReady, setStateReady] = useState(false);
  const [stateLoaded, setStateLoaded] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'shortcuts'>('general');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyView, setHistoryView] = useState<'active' | 'archived'>('active');
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [shortcuts, setShortcuts] = useState<Shortcuts>(defaultShortcuts);
  const [recordingShortcut, setRecordingShortcut] = useState<ShortcutName | null>(null);
  const [shortcutError, setShortcutError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const t = copy[language];
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages || [];

  const apiRequest = useMemo(() => createApiClient(getToken), [getToken]);

  useEffect(() => {
    let cancelled = false;
    const loadState = async () => {
      try {
        const legacyChats = readStored<Chat[]>(legacyStorageKey, []);
        const storedTheme = localStorage.getItem('gennio-theme');
        const storedLanguage = localStorage.getItem('gennio-language');
        const storedShortcuts = readStored<Partial<Shortcuts> | null>('gennio-shortcuts', null);
        const hasLegacyState = legacyChats.length > 0 || storedTheme || storedLanguage || storedShortcuts;

        if (hasLegacyState) {
          await apiRequest<{ migrated: boolean }>('/api/migrate-local-state', {
            method: 'POST',
            body: JSON.stringify({
              chats: legacyChats,
              settings: {
                theme: storedTheme || 'dark',
                language: storedLanguage || 'en',
                shortcuts: { ...defaultShortcuts, ...(storedShortcuts || {}) }
              }
            })
          });
          localStorage.removeItem(legacyStorageKey);
          localStorage.removeItem('gennio-theme');
          localStorage.removeItem('gennio-language');
          localStorage.removeItem('gennio-shortcuts');
        }

        const state = await apiRequest<ApplicationStateResponse>('/api/state');
        if (cancelled) return;
        setChats(state.chats || []);
        if (state.settings) {
          setTheme(state.settings.theme || 'dark');
          setLanguage(state.settings.language || 'en');
          setShortcuts({ ...defaultShortcuts, ...(state.settings.shortcuts || {}) });
        }
        setStateLoaded(true);
        setStateReady(true);
      } catch (error) {
        console.error('Unable to load Firestore state', error);
        if (!cancelled) setStateReady(true);
      }
    };
    loadState();
    return () => { cancelled = true; };
  }, [legacyStorageKey]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (!stateLoaded) return undefined;
    const timeout = window.setTimeout(() => {
      apiRequest<{ settings: Preferences }>('/api/settings', { method: 'PUT', body: JSON.stringify({ theme, language, shortcuts }) })
        .catch((error) => console.error('Unable to save settings', error));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [theme, language, shortcuts, stateLoaded]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (recordingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'Escape') {
          setRecordingShortcut(null);
          setShortcutError('');
          return;
        }
        if (['Meta', 'Control', 'Alt', 'Shift'].includes(event.key)) return;
        if (!event.metaKey && !event.ctrlKey && !event.altKey) {
          setShortcutError(t.shortcutModifier);
          return;
        }
        const candidate: Shortcut = { key: event.key.toLowerCase(), alt: event.altKey, ctrl: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey };
        const conflictsWithSearch = candidate.key === 'k' && !candidate.alt && !candidate.shift && (candidate.meta || candidate.ctrl);
        const conflictsWithCustom = Object.entries(shortcuts).some(([name, value]) => name !== recordingShortcut && sameShortcut(candidate, value));
        if (conflictsWithSearch || conflictsWithCustom) {
          setShortcutError(t.shortcutConflict);
          return;
        }
        setShortcuts((current) => ({ ...current, [recordingShortcut]: candidate }));
        setRecordingShortcut(null);
        setShortcutError('');
        return;
      }
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (matchesShortcut(event, shortcuts.newChat)) {
        event.preventDefault();
        setActiveChatId(null);
        setInput('');
        setFiles([]);
        setHistoryView('active');
        setSearchOpen(false);
        setSettingsOpen(false);
        setActionMenu(null);
        return;
      }
      if (matchesShortcut(event, shortcuts.archived)) {
        event.preventDefault();
        setHistoryView('archived');
        setSearchOpen(false);
        setSettingsOpen(false);
        setActionMenu(null);
        return;
      }
      if (matchesShortcut(event, shortcuts.settings)) {
        event.preventDefault();
        setSearchOpen(false);
        setSettingsOpen(true);
        setSettingsTab('general');
        return;
      }
      if (event.key !== 'Escape') return;
      setActionMenu(null);
      setDialog(null);
      setSettingsOpen(false);
      setSearchOpen(false);
      setSearchQuery('');
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [recordingShortcut, shortcuts, t.shortcutConflict, t.shortcutModifier]);

  const startNewChat = () => {
    setActiveChatId(null);
    setInput('');
    setFiles([]);
    setSidebarOpen(false);
    setHistoryView('active');
    setActionMenu(null);
    setLoadingMessages(false);
  };

  const openChat = async (id: string): Promise<void> => {
    setActiveChatId(id);
    setInput('');
    setFiles([]);
    setSidebarOpen(false);
    setActionMenu(null);
    const chat = chats.find((item) => item.id === id);
    if (!chat || chat.messagesLoaded) return;
    setLoadingMessages(true);
    try {
      const data = await apiRequest<{ messages: Message[] }>(`/api/chats/${encodeURIComponent(id)}/messages`);
      setChats((current) => current.map((item) => item.id === id ? { ...item, messages: data.messages, messagesLoaded: true } : item));
    } catch (error) {
      console.error('Unable to load messages', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectSearchResult = (chat: Chat) => {
    setHistoryView(chat.archived ? 'archived' : 'active');
    openChat(chat.id);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const formatChatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const days = Math.round((startToday.getTime() - startDate.getTime()) / 86400000);
    if (days === 0) return t.today;
    if (days === 1) return t.yesterday;
    return new Intl.DateTimeFormat(language === 'sl' ? 'sl-SI' : 'en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const openActionMenu = (event: MouseEvent<HTMLButtonElement>, chatId: string) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setActionMenu({ chatId, left: Math.max(8, Math.min(window.innerWidth - 200, rect.right - 190)), top: Math.min(window.innerHeight - 190, rect.bottom + 5) });
  };

  const updateChatMetadata = (chatId: string, metadata: Partial<Pick<Chat, 'title' | 'pinned' | 'archived'>>) => {
    apiRequest<{ updated: boolean }>(`/api/chats/${encodeURIComponent(chatId)}`, { method: 'PATCH', body: JSON.stringify(metadata) })
      .catch((error) => console.error('Unable to update chat', error));
  };

  const togglePin = (chat: Chat) => {
    const pinned = !chat.pinned;
    setChats((current) => current.map((item) => item.id === chat.id ? { ...item, pinned } : item));
    updateChatMetadata(chat.id, { pinned });
    setActionMenu(null);
  };

  const beginRename = (chat: Chat) => {
    setRenameValue(chat.title);
    setDialog({ type: 'rename', chatId: chat.id });
    setActionMenu(null);
  };

  const saveRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog) return;
    const title = renameValue.trim();
    if (!title) return;
    const nextTitle = title.slice(0, 80);
    setChats((current) => current.map((chat) => chat.id === dialog.chatId ? { ...chat, title: nextTitle } : chat));
    updateChatMetadata(dialog.chatId, { title: nextTitle });
    setDialog(null);
  };

  const toggleArchive = (chat: Chat) => {
    const willArchive = !chat.archived;
    setChats((current) => current.map((item) => item.id === chat.id ? { ...item, archived: willArchive, updatedAt: Date.now() } : item));
    updateChatMetadata(chat.id, { archived: willArchive });
    if (willArchive && activeChatId === chat.id) startNewChat();
    setActionMenu(null);
  };

  const confirmDelete = () => {
    if (!dialog) return;
    const chatId = dialog.chatId;
    setChats((current) => current.filter((chat) => chat.id !== chatId));
    apiRequest<{ deleted: boolean }>(`/api/chats/${encodeURIComponent(chatId)}`, { method: 'DELETE' })
      .catch((error) => console.error('Unable to delete chat', error));
    if (activeChatId === chatId) startNewChat();
    setDialog(null);
  };

  const appendMessage = (chatId: string, message: Message) => {
    setChats((current) => current.map((chat) => chat.id === chatId ? { ...chat, messages: [...chat.messages, message], updatedAt: Date.now() } : chat));
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loadingChatId || (activeChatId && !activeChat?.messagesLoaded)) return;

    const persistedMessages = messages.filter((message) => !message.ephemeral);
    const nextOrder = persistedMessages.reduce((highest, message, index) => Math.max(highest, message.order ?? index), -1) + 1;
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed, createdAt: Date.now(), order: nextOrder };
    const chatId = activeChatId || crypto.randomUUID();
    const requestMessages = activeChatId ? [...persistedMessages, userMessage] : [userMessage];
    const title = activeChat?.title || trimmed.slice(0, 46);
    const isNew = !activeChatId;
    const responseMessageId = crypto.randomUUID();

    if (isNew) {
      const newChat: Chat = { id: chatId, title, pinned: false, archived: false, messages: requestMessages, messagesLoaded: true, createdAt: userMessage.createdAt, updatedAt: userMessage.createdAt };
      setChats((current) => [newChat, ...current]);
      setActiveChatId(chatId);
    } else {
      appendMessage(chatId, userMessage);
    }

    setInput('');
    setLoadingChatId(chatId);

    try {
      const token = await getToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          chatId,
          title,
          isNew,
          responseMessageId,
          messages: requestMessages.slice(-30).map(({ role, content }) => ({ role, content })),
          userMessage
        })
      });
      const data = await response.json() as { error?: string; message?: Message };
      if (!response.ok && data.message) {
        appendMessage(chatId, data.message);
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Could not reach model');
      if (!data.message) throw new Error('Model returned no message');
      appendMessage(chatId, data.message);
    } catch (error: unknown) {
      const errorMessage: Message = { id: responseMessageId, role: 'assistant', content: `I couldn’t complete that request. ${getErrorMessage(error)}`, createdAt: Date.now(), order: nextOrder + 1, error: true };
      appendMessage(chatId, errorMessage);
      apiRequest<{ message: Message }>(`/api/chats/${encodeURIComponent(chatId)}/messages`, { method: 'POST', body: JSON.stringify(errorMessage) })
        .catch((storageError) => console.error('Unable to save error message', storageError));
    } finally {
      setLoadingChatId(null);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (selected.length > MAX_ATTACHMENTS) {
      setAttachmentError(`Choose no more than ${MAX_ATTACHMENTS} images.`);
      return;
    }
    if (selected.some((file) => !ALLOWED_IMAGE_TYPES.has(file.type))) {
      setAttachmentError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (selected.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
      setAttachmentError('Each image must be 5 MB or smaller.');
      return;
    }
    setAttachmentError('');
    setFiles(selected);
  };
  const firstName = user.name?.trim().split(' ')[0];
  const visibleChats = chats
    .filter((chat) => historyView === 'archived' ? chat.archived : !chat.archived)
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.updatedAt - a.updatedAt);
  const menuChat = chats.find((chat) => chat.id === actionMenu?.chatId);
  const searchResults = [...chats]
    .filter((chat) => chat.title.toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase()))
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.updatedAt - a.updatedAt);
  const shortcutParts = (shortcut: Shortcut): string[] => {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push(applePlatform ? '⌥' : 'Alt');
    if (shortcut.shift) parts.push(applePlatform ? '⇧' : 'Shift');
    if (shortcut.meta) parts.push('⌘');
    const names: Record<string, string> = { ' ': 'Space', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→' };
    parts.push(names[shortcut.key] || (shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key));
    return parts;
  };

  return (
    <div className="chat-app">
      <button className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-topline">
          <button className="brand brand-button" type="button" onClick={() => { setHistoryView('active'); setActionMenu(null); }} aria-label="Show saved chats"><span className="brand-mark">G</span><span>GeNNio</span></button>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><Icon name="close" /></button>
        </div>

        <nav className="primary-nav" aria-label="Main navigation">
          <button className={`nav-item ${activeChatId === null && historyView === 'active' ? 'is-active' : ''}`} onClick={startNewChat}><Icon name="compose" /><span>{t.newChat}</span></button>
          <button className="nav-item" type="button" onClick={() => { setSearchOpen(true); setSidebarOpen(false); }}><Icon name="search" /><span>{t.search}</span><kbd>⌘K</kbd></button>
          <button className={`nav-item ${historyView === 'archived' ? 'is-active' : ''}`} type="button" onClick={() => { setHistoryView('archived'); setActionMenu(null); }}><Icon name="archive" /><span>{t.archived}</span></button>
        </nav>

        <div className="recent-section">
          <p className="sidebar-label">{historyView === 'archived' ? t.archived : t.chats}</p>
          <div className="chat-history">
            {visibleChats.length > 0 ? visibleChats.map((chat) => (
              <div key={chat.id} className={`chat-history-row ${activeChatId === chat.id ? 'is-active' : ''}`}>
                <button className="recent-chat" onClick={() => openChat(chat.id)} title={chat.title}>
                  <span>{chat.title}</span>{chat.pinned && <i className="pinned-mark" title={t.pinned}><Icon name="pin" size={13} /></i>}
                </button>
                <button className="chat-more" onClick={(event) => openActionMenu(event, chat.id)} aria-label={`Actions for ${chat.title}`} aria-expanded={actionMenu?.chatId === chat.id}><Icon name="more" size={19} /></button>
              </div>
            )) : <p className="recent-empty">{historyView === 'archived' ? t.archivedEmpty : t.empty}</p>}
          </div>
        </div>

        <div className="sidebar-bottom">
          <button className="settings-trigger" onClick={() => { setSettingsOpen(true); setSettingsTab('general'); }}><Icon name="settings" /><span>{t.settings}</span></button>
          <div className="sidebar-account">
            <div className="avatar">{(user.name || user.email || 'U').charAt(0).toUpperCase()}</div>
            <div className="account-copy"><strong>{user.name || t.account}</strong><span>{user.email}</span></div>
            <button className="icon-button" onClick={onLogout} aria-label={t.logout} title={t.logout}><Icon name="logout" /></button>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div className="model-label">GeNNio <span>1.0</span></div>
          <div className="status"><span></span>{t.operational}</div>
        </header>

        <main className={`chat-main ${messages.length === 0 ? 'is-empty' : ''}`}>
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-mark"><Icon name="check" size={22} /></div>
              <h1>{firstName ? `${t.welcome}, ${firstName}.` : t.ready}</h1>
              <p>{t.prompt}</p>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((msg, idx) => (
                <article key={`${msg.role}-${idx}`} className={`message ${msg.role}`}>
                  <div className="message-author">{msg.role === 'assistant' ? <span className="mini-mark">G</span> : <span className="mini-avatar">{(user.name || 'Y')[0]}</span>}</div>
                  <div><strong>{msg.role === 'assistant' ? 'GeNNio' : t.you}</strong><p>{msg.content}</p></div>
                </article>
              ))}
              {loadingChatId === activeChatId && <div className="thinking"><i /><i /><i /></div>}
            </div>
          )}
        </main>

        <div className="composer-dock">
          {files.length > 0 && <div className="file-strip">{files.map((file) => <span key={`${file.name}-${file.lastModified}`}>{file.name}<button type="button" onClick={() => setFiles((prev) => prev.filter((item) => item !== file))} aria-label={`Remove ${file.name}`}>×</button></span>)}</div>}
          {attachmentError && <p className="attachment-error" role="alert">{attachmentError}</p>}
          <form className="composer" onSubmit={sendMessage}>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFileChange} hidden />
            <button type="button" className="composer-action" onClick={() => fileRef.current?.click()} aria-label="Attach images"><Icon name="plus" size={22} /></button>
            <input className="composer-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={t.placeholder} maxLength={4000} aria-label={t.placeholder} />
            <button className="composer-send" type="submit" disabled={!stateReady || loadingMessages || Boolean(activeChat && !activeChat.messagesLoaded) || Boolean(loadingChatId) || !input.trim()} aria-label="Send message"><Icon name="arrow" size={18} /></button>
          </form>
          <p className="composer-note">{t.note}</p>
        </div>
      </section>

      {searchOpen && (
        <div className="search-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSearchOpen(false)}>
          <section className="search-panel" role="dialog" aria-modal="true" aria-label={t.search}>
            <div className="search-field"><Icon name="search" size={24} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t.searchPlaceholder} autoFocus /><kbd>ESC</kbd></div>
            <div className="search-results">
              <p className="search-heading">{searchQuery ? t.search : t.recent}</p>
              {searchResults.length > 0 ? searchResults.map((chat) => (
                <button className="search-result" key={chat.id} onClick={() => selectSearchResult(chat)}>
                  <span className="search-result-title">{chat.pinned && <Icon name="pin" size={14} />}{chat.title}</span>
                  <span className="search-result-meta">{chat.archived && <i>{t.archivedTag}</i>}{formatChatDate(chat.updatedAt)}</span>
                </button>
              )) : <p className="search-empty">{t.noResults}</p>}
            </div>
          </section>
        </div>
      )}

      {actionMenu && menuChat && (
        <>
          <button className="action-menu-dismiss" onClick={() => setActionMenu(null)} aria-label="Close conversation menu" />
          <div className="chat-action-menu" style={{ left: actionMenu.left, top: actionMenu.top }} role="menu">
            <button role="menuitem" onClick={() => togglePin(menuChat)}><Icon name="pin" /><span>{menuChat.pinned ? t.unpinned : t.pinned}</span></button>
            <button role="menuitem" onClick={() => beginRename(menuChat)}><Icon name="edit" /><span>{t.rename}</span></button>
            <button role="menuitem" onClick={() => toggleArchive(menuChat)}><Icon name="archive" /><span>{menuChat.archived ? t.restore : t.archiveAction}</span></button>
            <div className="menu-divider" />
            <button className="danger" role="menuitem" onClick={() => { setDialog({ type: 'delete', chatId: menuChat.id }); setActionMenu(null); }}><Icon name="trash" /><span>{t.delete}</span></button>
          </div>
        </>
      )}

      {dialog && (
        <div className="modal-backdrop compact-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDialog(null)}>
          {dialog.type === 'rename' ? (
            <form className="compact-dialog" onSubmit={saveRename} role="dialog" aria-modal="true" aria-labelledby="rename-title">
              <h2 id="rename-title">{t.renameTitle}</h2><p>{t.renameHint}</p>
              <input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={80} autoFocus />
              <div className="dialog-actions"><button type="button" className="secondary" onClick={() => setDialog(null)}>{t.cancel}</button><button type="submit" className="primary" disabled={!renameValue.trim()}>{t.save}</button></div>
            </form>
          ) : (
            <section className="compact-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
              <div className="dialog-danger-icon"><Icon name="trash" size={20} /></div>
              <h2 id="delete-title">{t.deleteTitle}</h2><p>{t.deleteHint}</p>
              <div className="dialog-actions"><button type="button" className="secondary" onClick={() => setDialog(null)}>{t.cancel}</button><button type="button" className="delete-confirm" onClick={confirmDelete}>{t.deleteConfirm}</button></div>
            </section>
          )}
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSettingsOpen(false); setRecordingShortcut(null); setShortcutError(''); } }}>
          <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <aside className="settings-nav">
              <button className="settings-close" onClick={() => { setSettingsOpen(false); setRecordingShortcut(null); setShortcutError(''); }} aria-label="Close settings"><Icon name="close" size={22} /></button>
              <button className={`settings-tab ${settingsTab === 'general' ? 'is-active' : ''}`} onClick={() => { setSettingsTab('general'); setRecordingShortcut(null); setShortcutError(''); }}><Icon name="settings" /><span>{t.general}</span></button>
              <button className={`settings-tab ${settingsTab === 'shortcuts' ? 'is-active' : ''}`} onClick={() => setSettingsTab('shortcuts')}><Icon name="keyboard" /><span>{t.shortcuts}</span></button>
            </aside>
            <div className="settings-content">
              <h2 id="settings-title">{settingsTab === 'general' ? t.general : t.shortcuts}</h2>
              {settingsTab === 'general' ? (
                <div className="settings-list">
                  <label className="setting-row"><span><Icon name="sun" /><b>{t.appearance}</b></span><select value={theme} onChange={(event) => setTheme(event.target.value as Theme)}><option value="dark">{t.dark}</option><option value="light">{t.light}</option></select></label>
                  <label className="setting-row"><span><Icon name="globe" /><b>{t.language}</b></span><select value={language} onChange={(event) => setLanguage(event.target.value as Language)}><option value="en">English</option><option value="sl">Slovenščina</option></select></label>
                </div>
              ) : (
                <div className="shortcuts-section">
                  <p>{t.shortcutHint}</p>
                  {shortcutError && <p className="shortcut-error" role="alert">{shortcutError}</p>}
                  <div className="shortcut-list">
                    {([
                      ['newChat', t.shortcutNew],
                      ['archived', t.shortcutArchived],
                      ['settings', t.shortcutSettings]
                    ] as Array<[ShortcutName, string]>).map(([name, label]) => (
                      <div className="shortcut-row" key={name}>
                        <span>{label}</span>
                        <button className={`shortcut-recorder ${recordingShortcut === name ? 'is-recording' : ''}`} type="button" onClick={() => { setRecordingShortcut(name); setShortcutError(''); }} aria-label={`Change shortcut for ${label}`}>
                          {recordingShortcut === name ? <em>{t.pressShortcut}</em> : shortcutParts(shortcuts[name]).map((part) => <kbd key={part}>{part}</kbd>)}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
