import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  setDoc,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing, Category, User, Chat, Message, Notification, Rating, Transaction, TransactionStatus } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ─── Búsqueda: genera keywords normalizadas para un listing ──────────────────
export function generateSearchKeywords(title: string, description: string, category: string): string[] {
  const text = `${title} ${description} ${category}`.toLowerCase();
  // Eliminar caracteres especiales y dividir en palabras únicas de ≥ 3 caracteres
  const words = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length >= 3);
  return [...new Set(words)];
}

export const firestoreService = {
  // ─── Listings ──────────────────────────────────────────────────────────────

  getListings: (
    callback: (listings: Listing[], lastDoc: QueryDocumentSnapshot<DocumentData> | null) => void,
    filters?: { category?: Category | null; searchTerm?: string },
    lastVisible?: QueryDocumentSnapshot<DocumentData> | null,
    pageSize: number = 20
  ) => {
    const listingsRef = collection(db, 'listings');
    const constraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (filters?.category) {
      constraints.splice(1, 0, where('category', '==', filters.category));
    }

    // Búsqueda server-side: filtra por keyword si hay searchTerm y no hay categoría activa
    if (filters?.searchTerm && !filters.category) {
      const keyword = filters.searchTerm
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .split(/\s+/)[0]; // primera palabra como pivot
      if (keyword.length >= 3) {
        constraints.splice(1, 0, where('searchKeywords', 'array-contains', keyword));
      }
    }

    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    const q = query(listingsRef, ...constraints);

    return onSnapshot(q, (snapshot) => {
      const listings = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[];
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      callback(listings, lastDoc);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'listings');
    });
  },

  getListingById: async (id: string): Promise<Listing | null> => {
    try {
      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Listing;
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `listings/${id}`);
      return null;
    }
  },

  incrementListingViews: async (listingId: string) => {
    try {
      const shardsRef = collection(db, 'listings', listingId, 'viewCounters');
      await addDoc(shardsRef, { count: 1, timestamp: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `listings/${listingId}/viewCounters`);
    }
  },

  createListing: async (listing: Omit<Listing, 'id' | 'createdAt' | 'views'>) => {
    try {
      const listingsRef = collection(db, 'listings');
      const keywords = generateSearchKeywords(listing.title, listing.description, listing.category);
      const docRef = await addDoc(listingsRef, {
        ...listing,
        views: 0,
        searchKeywords: keywords,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'listings');
    }
  },

  updateListing: async (id: string, data: Partial<Listing>) => {
    try {
      const docRef = doc(db, 'listings', id);
      const update: any = { ...data };
      // Regenerar keywords si cambió el título o descripción
      if (data.title || data.description || data.category) {
        const existing = await getDoc(docRef);
        const ex = existing.data() || {};
        update.searchKeywords = generateSearchKeywords(
          data.title ?? ex.title ?? '',
          data.description ?? ex.description ?? '',
          data.category ?? ex.category ?? ''
        );
      }
      await updateDoc(docRef, update);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `listings/${id}`);
    }
  },

  getUserListings: (userId: string, callback: (listings: Listing[]) => void) => {
    const listingsRef = collection(db, 'listings');
    const q = query(listingsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const listings = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[];
      callback(listings);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'listings');
    });
  },

  // ─── Users ─────────────────────────────────────────────────────────────────

  getUserProfile: async (id: string): Promise<User | null> => {
    try {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return docSnap.data() as User;
      return null;
    } catch (error) {
      // Retornar null en lugar de relanzar: el perfil es opcional
      // (puede fallar por permisos si el lector no está autenticado)
      console.warn('getUserProfile failed silently:', error instanceof Error ? error.message : error);
      return null;
    }
  },

  // ─── Transactions ──────────────────────────────────────────────────────────

  createTransaction: async (tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const ref = collection(db, 'transactions');
      const docRef = await addDoc(ref, {
        ...tx,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
      throw error;
    }
  },

  getTransactionById: async (id: string): Promise<Transaction | null> => {
    try {
      const docRef = doc(db, 'transactions', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Transaction;
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `transactions/${id}`);
      return null;
    }
  },

  listenTransaction: (id: string, callback: (tx: Transaction | null) => void) => {
    const docRef = doc(db, 'transactions', id);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Transaction);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `transactions/${id}`);
    });
  },

  updateTransactionStatus: async (
    id: string,
    status: TransactionStatus,
    extra?: { paymentReference?: string; paymentScreenshot?: string }
  ) => {
    try {
      const docRef = doc(db, 'transactions', id);
      await updateDoc(docRef, { status, ...extra });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
    }
  },

  getUserTransactions: (userId: string, callback: (txs: Transaction[]) => void) => {
    const ref = collection(db, 'transactions');
    const q = query(
      ref,
      where('buyerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, async (snap) => {
      const txs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
      callback(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });
  },

  getSellerTransactions: (userId: string, callback: (txs: Transaction[]) => void) => {
    const ref = collection(db, 'transactions');
    const q = query(
      ref,
      where('sellerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });
  },

  // ─── Chats ─────────────────────────────────────────────────────────────────

  getChats: (userId: string, callback: (chats: Chat[]) => void) => {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userId), orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Chat[];
      callback(chats);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });
  },

  getChatById: async (id: string): Promise<Chat | null> => {
    try {
      const docRef = doc(db, 'chats', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Chat;
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `chats/${id}`);
      return null;
    }
  },

  createChat: async (chatData: Omit<Chat, 'id' | 'updatedAt'>) => {
    try {
      const chatsRef = collection(db, 'chats');
      const docRef = await addDoc(chatsRef, { ...chatData, updatedAt: serverTimestamp() });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  },

  findExistingChat: async (userId: string, sellerId: string, listingId: string): Promise<string | null> => {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', userId), where('listingId', '==', listingId));
      const querySnapshot = await getDocs(q);
      const existingChat = querySnapshot.docs.find(d => d.data().participants.includes(sellerId));
      return existingChat ? existingChat.id : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'chats');
      return null;
    }
  },

  // ─── Messages ──────────────────────────────────────────────────────────────

  getMessages: (chatId: string, callback: (messages: Message[]) => void) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Message[];
      callback(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });
  },

  sendMessage: async (chatId: string, message: Omit<Message, 'id' | 'createdAt'>) => {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const chatRef = doc(db, 'chats', chatId);
      await addDoc(messagesRef, { ...message, createdAt: serverTimestamp() });
      await updateDoc(chatRef, {
        lastMessage: { text: message.text, senderId: message.senderId, createdAt: serverTimestamp() },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages`);
    }
  },

  // ─── Notifications ─────────────────────────────────────────────────────────

  getNotifications: (userId: string, callback: (notifications: Notification[]) => void) => {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Notification[];
      callback(notifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/notifications`);
    });
  },

  markNotificationAsRead: async (userId: string, notificationId: string) => {
    try {
      const docRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/notifications/${notificationId}`);
    }
  },

  // ─── Ratings ───────────────────────────────────────────────────────────────

  createRating: async (rating: Omit<Rating, 'id' | 'createdAt'>) => {
    try {
      const ratingsRef = collection(db, 'ratings');
      const docRef = doc(ratingsRef, rating.transactionId);
      await setDoc(docRef, { ...rating, createdAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ratings');
    }
  },

  getUserRatings: (userId: string, callback: (ratings: Rating[]) => void) => {
    const ratingsRef = collection(db, 'ratings');
    const q = query(ratingsRef, where('ratedUserId', '==', userId), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const ratings = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Rating[];
      callback(ratings);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ratings');
    });
  }
};
