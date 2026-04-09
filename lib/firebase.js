import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  // These will be provided by the user in .env.local
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase conditionally to prevent build-time crashes
let app;
let db;
let auth;
let storage;

const isConfigValid = typeof window !== "undefined" && process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (err) {
    console.error("Firebase Initialization Error:", err);
  }
}

// Global safeguard: if initialization failed or keys are missing, 
// provide non-crashing Proxy objects to prevent blank screens.
if (!db || !auth || !storage) {
  const handler = {
    get: (target, prop) => {
      console.warn(`Firebase [${prop}] accessed but keys are missing. Configure Vercel Environment Variables.`);
      return () => ({}); // Return dummy function to prevent crashes on calls like collection()
    }
  };
  
  db = db || new Proxy({}, handler);
  auth = auth || new Proxy({}, handler);
  storage = storage || new Proxy({}, handler);
}

export { db, auth, storage };
