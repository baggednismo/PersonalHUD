
import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

// Ensure critical Firebase config values are present and are non-empty strings
if (typeof apiKey !== 'string' || apiKey.trim() === '') {
  throw new Error(
    'Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or empty. Please ensure it is correctly set in your .env.local file (in the project root) AND that you have RESTARTED your Next.js development server.'
  );
}
if (typeof projectId !== 'string' || projectId.trim() === '') {
  throw new Error(
    'Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is missing or empty. Please ensure it is correctly set in your .env.local file (in the project root) AND that you have RESTARTED your Next.js development server.'
  );
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

let appInstance: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;

// Initialize Firebase
if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig);
} else {
  appInstance = getApp();
}

authInstance = getAuth(appInstance);
dbInstance = getFirestore(appInstance);

export { appInstance as app, authInstance as auth, dbInstance as db };
