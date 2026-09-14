import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App using AI Studio provisioned configuration
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Connect with the provisioned firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Validate Connection to Firestore on startup
if (typeof window !== 'undefined') {
  getDocFromServer(doc(db, 'test', 'connection'))
    .then(() => {
      console.log('[Firebase] Cloud Firestore terhubung:', firebaseConfig.firestoreDatabaseId);
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

export { firebaseConfig };




