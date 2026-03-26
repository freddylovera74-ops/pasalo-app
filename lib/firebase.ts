import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import { getMessaging, isSupported as messagingSupported } from 'firebase/messaging';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

const app = initializeApp(firebaseConfig);

// App Check (reCAPTCHA v3)
if (typeof window !== 'undefined') {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  } else {
    console.warn('reCAPTCHA site key not found. App Check is disabled.');
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID);
export const storage = getStorage(app);

// Analytics — solo en browser y si el entorno lo soporta
export const analytics = typeof window !== 'undefined'
  ? analyticsSupported().then(yes => yes ? getAnalytics(app) : null)
  : Promise.resolve(null);

// Messaging — solo en browser y si el entorno lo soporta
export const messaging = typeof window !== 'undefined'
  ? messagingSupported().then(yes => yes ? getMessaging(app) : null)
  : Promise.resolve(null);

export default app;
