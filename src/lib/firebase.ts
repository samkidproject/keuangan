import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

// User's personal Firebase Configuration: ba-bun
export const personalFirebaseConfig = {
  apiKey: "AIzaSyAWZPW-Ff_B404d0OikYYVkIeE8HGHeqyA",
  authDomain: "ba-bun.firebaseapp.com",
  projectId: "ba-bun",
  storageBucket: "ba-bun.firebasestorage.app",
  messagingSenderId: "812134788785",
  appId: "1:812134788785:web:741d9d86483b2b189b7c90",
  measurementId: "G-WZFFRMM5GL"
};

export const firebaseConfig = personalFirebaseConfig;

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect to Cloud Firestore in personal project ba-bun
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Validate Connection to Firestore on startup
if (typeof window !== 'undefined') {
  getDocFromServer(doc(db, 'satker_accounts', 'admin'))
    .then(() => {
      console.log('[Firebase] Cloud Firestore terhubung ke Firebase Pribadi:', firebaseConfig.projectId);
    })
    .catch((error) => {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase network/configuration.');
      } else {
        console.debug('[Firebase] Connection ping:', error?.message || 'ready');
      }
    });

  // Optional anonymous sign-in session
  signInAnonymously(auth).catch((err) => {
    console.debug('Firebase auth session:', err?.code || err?.message || 'ready');
  });
}




