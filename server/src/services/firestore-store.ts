import { randomUUID } from 'crypto';
import type { DocumentData, DocumentReference, QuerySnapshot } from 'firebase-admin/firestore';
import { db } from '../firebase-admin.js';
import { config } from '../config.js';
import type { MigrationPayload, StoredMessage } from '../schemas.js';

interface FirestoreWrite { ref: DocumentReference<DocumentData>; data: DocumentData }
interface OwnedChat { ref: DocumentReference<DocumentData>; data: DocumentData }

export const userRefFor = (uid: string) => db.collection('users').doc(uid);
export const chatsRefFor = (uid: string) => userRefFor(uid).collection('chats');
export const settingsRefFor = (uid: string) => userRefFor(uid).collection('settings').doc('preferences');

export async function commitWrites(writes: FirestoreWrite[]): Promise<void> {
  for (let index = 0; index < writes.length; index += 450) {
    const batch = db.batch();
    writes.slice(index, index + 450).forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
  }
}

export async function getOwnedChat(uid: string, chatId: string): Promise<OwnedChat | null> {
  const ref = chatsRefFor(uid).doc(chatId);
  const snapshot = await ref.get();
  const data = snapshot.data();
  if (!snapshot.exists || !data || data.schemaVersion !== 2) return null;
  return { ref, data };
}

export async function loadApplicationState(uid: string) {
  const [chatSnapshot, settingsSnapshot] = await Promise.all([
    chatsRefFor(uid).orderBy('updatedAt', 'desc').limit(config.MAX_CHATS_PER_USER).get(),
    settingsRefFor(uid).get()
  ]);
  const validChatDocs = chatSnapshot.docs.filter((doc) => doc.data()?.schemaVersion === 2);
  const chats = validChatDocs.map((chatDoc) => {
    const data = chatDoc.data();
    return {
      id: chatDoc.id,
      title: data.title,
      pinned: Boolean(data.pinned),
      archived: Boolean(data.archived),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      messages: [],
      messagesLoaded: false
    };
  });
  return { chats, settings: settingsSnapshot.exists ? settingsSnapshot.data() : null };
}

export async function loadChatMessages(uid: string, chatId: string): Promise<StoredMessage[] | null> {
  const owned = await getOwnedChat(uid, chatId);
  if (!owned) return null;
  const snapshot = await owned.ref.collection('messages').orderBy('order', 'asc').limit(config.MAX_MESSAGES_PER_CHAT).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as StoredMessage));
}

export async function migrateLocalState(uid: string, payload: MigrationPayload): Promise<boolean> {
  const userRef = userRefFor(uid);
  const userSnapshot = await userRef.get();
  if (userSnapshot.data()?.localStateMigratedAt) return false;
  const writes: FirestoreWrite[] = [];
  payload.chats.forEach((chat) => {
    const now = Date.now();
    const chatRef = chatsRefFor(uid).doc(chat.id);
    writes.push({ ref: chatRef, data: {
      schemaVersion: 2,
      title: chat.title,
      pinned: Boolean(chat.pinned),
      archived: Boolean(chat.archived),
      createdAt: chat.createdAt || now,
      updatedAt: chat.updatedAt || now
    } });
    chat.messages.forEach((message, index) => {
      const id = message.id || randomUUID();
      writes.push({ ref: chatRef.collection('messages').doc(id), data: {
        role: message.role,
        content: message.content,
        createdAt: message.createdAt || (chat.createdAt || now) + index,
        order: message.order ?? index,
        error: Boolean(message.error)
      } });
    });
  });
  if (payload.settings) writes.push({ ref: settingsRefFor(uid), data: { ...payload.settings, updatedAt: Date.now() } });
  await commitWrites(writes);
  await userRef.set({ localStateMigratedAt: new Date().toISOString() }, { merge: true });
  return true;
}

export async function deleteOwnedChat(uid: string, chatId: string): Promise<boolean> {
  const owned = await getOwnedChat(uid, chatId);
  if (!owned) return false;
  let snapshot: QuerySnapshot<DocumentData>;
  do {
    snapshot = await owned.ref.collection('messages').limit(450).get();
    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  } while (!snapshot.empty);
  await owned.ref.delete();
  return true;
}

export async function enforceChatCapacity(uid: string): Promise<boolean> {
  const snapshot = await chatsRefFor(uid).where('schemaVersion', '==', 2).count().get();
  return snapshot.data().count < config.MAX_CHATS_PER_USER;
}
