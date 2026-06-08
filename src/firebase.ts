import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only initialize if config is present (skip in demo mode)
const hasConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
const app = hasConfig
  ? (getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig))
  : null;

// These will be null in demo mode — only accessed in RealTaskProvider/RealAuthProvider
export const auth = app ? getAuth(app) : null as never;
export const db = app ? getFirestore(app) : null as never;
export const googleProvider = new GoogleAuthProvider();
