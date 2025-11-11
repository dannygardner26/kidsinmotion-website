import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

/**
 * Firebase Initialization Sequence:
 *
 * 1. Firebase App initializes (synchronous)
 * 2. Auth initializes (begins async internal initialization)
 * 3. Persistence is set (affects how auth state is stored)
 * 4. Firestore initializes with offline cache
 * 5. Auth completes internal initialization (accounts:lookup API call)
 * 6. onAuthStateChanged fires when auth state is detected
 *
 * IMPORTANT: Auth initialization is asynchronous. The auth object is created
 * immediately, but Firebase performs internal initialization (including the
 * accounts:lookup call) in the background. Always use onAuthStateChanged to
 * detect when auth is ready, and add delays before making API calls that
 * require authentication tokens.
 */

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
  apiKey: Boolean(process.env.REACT_APP_FIREBASE_API_KEY),
  authDomain: Boolean(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN),
  projectId: Boolean(process.env.REACT_APP_FIREBASE_PROJECT_ID)
});

// Add global error listener for uncaught Firebase errors
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('accounts:lookup')) {
    console.warn('Firebase accounts:lookup error caught (non-critical):', event.reason);
    // This is a known Firebase Auth internal error that doesn't affect functionality
    // Prevent it from showing in console as an unhandled error
    event.preventDefault();
  }
});

// Handle Firebase Auth persistence issues more carefully
// The aggressive cleanup code has been removed to prevent logout on refresh.
// Firebase's built-in token validation and persistence is sufficient.

// Initialize Firebase AFTER cleanup check
const app = initializeApp(firebaseConfig);
console.log("Firebase App initialized");

// Initialize Firebase Auth
// NOTE: Auth initialization is asynchronous. The auth object is created immediately,
// but Firebase performs internal initialization in the background.
const auth = getAuth(app);
console.log("Firebase Auth initializing...");

// Set auth persistence to local storage for persistent login with better error handling
// NOTE: Auth keys must persist across sessions for login persistence to work correctly.

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Auth persistence set successfully");
  })
  .catch((error) => {
    console.warn("Failed to set auth persistence:", error.code || error);
    console.warn("Auth will still work but sessions won't persist across browser restarts");
  });
let analytics;

if (typeof window !== "undefined" && process.env.REACT_APP_FIREBASE_MEASUREMENT_ID && window.location.hostname !== "localhost") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase analytics disabled:", error?.message || error);
  }
}
// Initialize Firestore with new cache settings
let db;
try {
  console.log("Initializing Firestore with offline persistence...");
  db = initializeFirestore(app, {
    cache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
  console.log("Firestore offline persistence enabled");
} catch (error) {
  console.warn("Firestore persistence error, falling back to default:", error);
  db = getFirestore(app);
}

const storage = getStorage(app);
let messaging;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn("Firebase messaging disabled:", error?.message || error);
}

export { auth, analytics, db, storage, messaging };
