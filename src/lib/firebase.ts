import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);

// Optional Analytics initialization if supported in environment
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  }).catch(() => {});
}
