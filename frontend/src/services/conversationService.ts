import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export type Conversation = {
  id: string;
  userId: string;
  title?: string;
  pageContext?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  messageCount?: number;
  pinned?: boolean;
  deletedAt?: Date | null;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  metadata?: Record<string, any>;
  sequence?: number;
};

function requireAuth(): string {
  const u = auth.currentUser;
  if (!u) throw new Error('Authentication required');
  return u.uid;
}

export const conversationService = {
  // Create a conversation for the current user
  async createConversation(params?: { title?: string; pageContext?: string }): Promise<string> {
    const userId = requireAuth();
    const conversationsRef = collection(db, 'conversations');
    const docRef = await addDoc(conversationsRef, {
      userId,
      title: params?.title ?? null,
      pageContext: params?.pageContext ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageAt: null,
      lastMessagePreview: null,
      messageCount: 0,
      pinned: false,
      deletedAt: null,
    });
    return docRef.id;
  },

  // Append a message to a conversation and update denormalized fields
  async addMessage(
    conversationId: string,
    message: { role: 'user' | 'assistant' | 'system'; content: string; metadata?: Record<string, any> }
  ): Promise<string> {
    const userId = requireAuth();
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');

    // Update parent conversation denormalized fields first to get atomic increment
    const convRef = doc(db, 'conversations', conversationId);

    await updateDoc(convRef, {
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      lastMessagePreview: message.content.substring(0, 160),
      messageCount: increment(1),
    } as any);

    // Add message with high-precision client timestamp for reliable ordering
    const messageDoc = await addDoc(messagesRef, {
      conversationId,
      userId,
      role: message.role,
      content: message.content,
      metadata: message.metadata ?? {},
      createdAt: serverTimestamp(),
      // Use high-precision client timestamp as fallback sort key
      clientTimestamp: Date.now(),
    });

    return messageDoc.id;
  },

  // Fetch conversations for current user
  async getConversations(limitCount = 50): Promise<Conversation[]> {
    const userId = requireAuth();
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('userId', '==', userId),
      orderBy('lastMessageAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
      createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
      lastMessageAt: d.data().lastMessageAt?.toDate?.(),
    }));
  },

  // Fetch messages for a conversation
  async getMessages(conversationId: string, limitCount = 200): Promise<ConversationMessage[]> {
    requireAuth();
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
      createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
    }));
  },

  // Real-time subscriptions
  subscribeToConversations(
    callback: (conversations: Conversation[]) => void,
    limitCount = 50
  ): () => void {
    const userId = requireAuth();
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('userId', '==', userId),
      orderBy('lastMessageAt', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
        lastMessageAt: d.data().lastMessageAt?.toDate?.(),
      }));
      callback(items as Conversation[]);
    });
  },

  subscribeToMessages(
    conversationId: string,
    callback: (messages: ConversationMessage[]) => void,
    limitCount = 200
  ): () => void {
    requireAuth();
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    // Sort by createdAt, then by clientTimestamp for tie-breaking
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(limitCount));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      }));
      callback(items as ConversationMessage[]);
    });
  },

  // Utilities
  async ensureConversation(existingId?: string, opts?: { title?: string; pageContext?: string }): Promise<string> {
    if (existingId) return existingId;
    return this.createConversation(opts);
  },

  async getConversation(conversationId: string): Promise<Conversation | null> {
    requireAuth();
    const ref = doc(db, 'conversations', conversationId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...(snap.data() as any),
      createdAt: snap.data().createdAt?.toDate?.() ?? new Date(),
      updatedAt: snap.data().updatedAt?.toDate?.() ?? new Date(),
      lastMessageAt: snap.data().lastMessageAt?.toDate?.(),
    } as Conversation;
  },
};
