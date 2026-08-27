import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { JournalEntry, ActiveConversation, ChatMessage, MoodType } from '../types';

/**
 * Strips all undefined properties from an object recursively to ensure
 * Firestore write operations never crash with "unsupported field value: undefined".
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) => (value === undefined ? null : value)));
}

export const firestoreService = {
  // --- JOURNAL ENTRIES ---

  /**
   * Save or update a journal entry under users/{userId}/journals/{journalId}
   */
  async saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
    if (!userId) throw new Error('User ID is required to save journal entry');
    if (!entry.id) throw new Error('Entry ID is required');

    const entryRef = doc(db, 'users', userId, 'journals', entry.id);
    const cleanData = sanitizeForFirestore({
      ...entry,
      userId,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(entryRef, cleanData, { merge: true });
  },

  /**
   * Get all journal entries for a user, ordered by createdAt descending
   */
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    if (!userId) return [];
    try {
      const journalsRef = collection(db, 'users', userId, 'journals');
      const q = query(journalsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as JournalEntry);
      });
      return entries;
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  },

  /**
   * Realtime subscription to journal entries for instant sync
   */
  subscribeJournalEntries(userId: string, callback: (entries: JournalEntry[]) => void): Unsubscribe {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const journalsRef = collection(db, 'users', userId, 'journals');
    const q = query(journalsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as JournalEntry);
      });
      callback(entries);
    }, (error) => {
      console.error('Realtime journal subscription error:', error);
    });
  },

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(userId: string, entryId: string): Promise<void> {
    if (!userId || !entryId) throw new Error('User ID and Entry ID required for deletion');
    const entryRef = doc(db, 'users', userId, 'journals', entryId);
    await deleteDoc(entryRef);
  },

  // --- CONVERSATION SESSIONS (DRAFTS/ACTIVE) ---

  /**
   * Save an active conversation draft
   */
  async saveConversation(userId: string, conversation: ActiveConversation): Promise<void> {
    if (!userId || !conversation.id) return;
    const convRef = doc(db, 'users', userId, 'conversations', conversation.id);
    const cleanData = sanitizeForFirestore({
      ...conversation,
      lastUpdated: new Date().toISOString()
    });
    await setDoc(convRef, cleanData, { merge: true });
  },

  /**
   * Fetch all active/saved conversations
   */
  async getConversations(userId: string): Promise<ActiveConversation[]> {
    if (!userId) return [];
    try {
      const convRef = collection(db, 'users', userId, 'conversations');
      const q = query(convRef, orderBy('lastUpdated', 'desc'));
      const snapshot = await getDocs(q);
      const conversations: ActiveConversation[] = [];
      snapshot.forEach((docSnap) => {
        conversations.push(docSnap.data() as ActiveConversation);
      });
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  /**
   * Delete a conversation draft
   */
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    if (!userId || !conversationId) return;
    const convRef = doc(db, 'users', userId, 'conversations', conversationId);
    await deleteDoc(convRef);
  }
};
