import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Debug: Check if Firebase config is loaded
console.log("Firebase Config Debug:", {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? "✅ Loaded" : "❌ Missing",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? "✅ Loaded" : "❌ Missing",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? "✅ Loaded" : "❌ Missing",
  config: firebaseConfig
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

export { auth, analytics, db, storage, messaging };
