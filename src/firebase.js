import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ─── Security Verification ────────────────────────────────────────────────────
// All VITE_* keys below are public client-side Firebase configuration.
// They are NOT Admin SDK private keys and carry no administrative privileges.
// Access control is enforced entirely by Firestore Security Rules on the server.
export const isConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_api_key_here" &&
  !firebaseConfig.apiKey.includes("FakeKeyPleaseReplace");

const app = initializeApp(firebaseConfig);

// ─── Firestore with Offline Persistence ──────────────────────────────────────
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);

// ─── Auth Persistence ─────────────────────────────────────────────────────────
// Use Firebase's built-in LOCAL persistence so the Auth session token is safely
// stored and managed by the Firebase SDK. Raw credentials (passwords) must never
// be stored in localStorage — Firebase handles session refresh automatically.
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Firebase Auth persistence config failed:", err?.message);
});

export default app;
