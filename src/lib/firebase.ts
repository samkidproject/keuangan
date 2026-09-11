import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Custom User Firebase Configuration for ba-bun
export const firebaseConfig = {
  apiKey: "AIzaSyAWZPW-Ff_B404d0OikYYVkIeE8HGHeqyA",
  authDomain: "ba-bun.firebaseapp.com",
  projectId: "ba-bun",
  storageBucket: "ba-bun.firebasestorage.app",
  messagingSenderId: "812134788785",
  appId: "1:812134788785:web:741d9d86483b2b189b7c90",
  measurementId: "G-WZFFRMM5GL"
};

// Initialize Firebase App for ba-bun
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Attempt silent anonymous authentication so Firestore and Firebase Storage operations
// have a valid session context if anonymous auth is configured in Firebase console.
if (typeof window !== 'undefined') {
  signInAnonymously(auth).catch((err) => {
    // Non-blocking: if anonymous auth is not enabled, public rule requests will still proceed
    console.debug('Firebase anonymous auth status:', err?.code || err?.message || 'ready');
  });
}




