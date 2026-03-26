import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithPhoneNumber,
  signInAnonymously,
  RecaptchaVerifier,
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { auth, db, messaging } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthReady: boolean;
  login: () => Promise<void>;
  loginWithPhone: (phone: string, recaptchaContainer: string) => Promise<ConfirmationResult>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Guarda el FCM token en el perfil del usuario
async function saveFcmToken(uid: string) {
  try {
    const m = await messaging;
    if (!m) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // VITE_FIREBASE_VAPID_KEY debe estar en .env
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(m, { vapidKey });
    if (!token) return;

    await updateDoc(doc(db, 'users', uid), { fcmToken: token });

    // Enviar config al service worker para notificaciones en background
    const reg = await navigator.serviceWorker.ready;
    const { default: app } = await import('../lib/firebase');
    reg.active?.postMessage({
      type: 'FIREBASE_CONFIG',
      config: (app as any).options,
    });
  } catch (err) {
    // Las notificaciones son opcionales; no bloquear si fallan
    console.warn('FCM token save failed:', err);
  }
}

function normalizeUser(data: any, fUser: FirebaseUser): User {
  return {
    uid: data.uid || data.id || fUser.uid,
    displayName: data.displayName || data.name || fUser.displayName || 'Usuario Pasalo',
    email: data.email || fUser.email || '',
    photoURL: data.photoURL || data.avatarUrl || fUser.photoURL ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${fUser.uid}`,
    reputation: data.reputation ?? 5.0,
    role: data.role || 'user',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const userRef = doc(db, 'users', fUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          setUser(normalizeUser(userDoc.data(), fUser));
        } else {
          const newUser: User = {
            uid: fUser.uid,
            displayName: fUser.isAnonymous ? 'Invitado' : (fUser.displayName || 'Usuario Pasalo'),
            email: fUser.email || '',
            photoURL: fUser.photoURL ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${fUser.uid}`,
            reputation: 5.0,
            role: 'user',
          };
          await setDoc(userRef, { ...newUser, createdAt: serverTimestamp() });
          setUser(newUser);
        }

        // Registrar FCM token en segundo plano
        saveFcmToken(fUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginAsGuest = async () => {
    await signInAnonymously(auth);
  };

  const loginWithPhone = async (
    phone: string,
    recaptchaContainerId: string
  ): Promise<ConfirmationResult> => {
    const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
    });
    return signInWithPhoneNumber(auth, phone, verifier);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user, firebaseUser, loading, isAuthReady,
      login, loginWithPhone, loginAsGuest, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
