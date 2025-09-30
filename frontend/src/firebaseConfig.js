import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCFe7YIJX_0VtKYDYA7GVTMoJDeTTAufeg",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "kids-in-motion-website-b1c09.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "kids-in-motion-website-b1c09",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "kids-in-motion-website-b1c09.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "839796180413",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:839796180413:web:b7a1f41253db31e8627ed4",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-63BGEP6TCX"
};

// Debug: Check if Firebase config is loaded
console.log("Firebase Config Debug:", {
  apiKey: Boolean(process.env.REACT_APP_FIREBASE_API_KEY),
  authDomain: Boolean(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN),
  projectId: Boolean(process.env.REACT_APP_FIREBASE_PROJECT_ID)
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let analytics;

if (typeof window !== "undefined" && process.env.REACT_APP_FIREBASE_MEASUREMENT_ID && window.location.hostname !== "localhost") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase analytics disabled:", error?.message || error);
  }
}
const db = getFirestore(app);

// Enable offline persistence for faster loading
try {
  enableMultiTabIndexedDbPersistence(db);
  console.log("Firestore offline persistence enabled");
} catch (error) {
  if (error.code === 'failed-precondition') {
    console.warn("Firestore persistence failed: Multiple tabs open");
  } else if (error.code === 'unimplemented') {
    console.warn("Firestore persistence not available in this browser");
  } else {
    console.warn("Firestore persistence error:", error);
  }
}

const storage = getStorage(app);
let messaging;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn("Firebase messaging disabled:", error?.message || error);
}

export { auth, analytics, db, storage, messaging };
