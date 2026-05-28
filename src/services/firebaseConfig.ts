import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Declare global variables for the Canvas environment
declare global {
  var __firebase_config: string | undefined;
  var __initial_auth_token: string | undefined;
  var __app_id: string | undefined;
}

// Hardcoded config as requested
const firebaseConfig = {
  apiKey: "AIzaSyAQMkBJlQYnY8oQkdnqENfnkA9SU2k8Hjw",
  authDomain: "neoays-stage0.firebaseapp.com",
  projectId: "neoays-stage0",
  storageBucket: "neoays-stage0.firebasestorage.app",
  messagingSenderId: "335928092721",
  appId: "1:335928092721:web:f9a77840047dcdf0d4cd10",
  measurementId: "G-NR6ZF1G6QE"
};

export const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
// Use a simpler default app ID for the path, as the Firebase App ID (with colons) is likely incorrect for the Firestore path.
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
