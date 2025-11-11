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

// Fetch interceptor removed - it was causing logout by returning empty users array
// Firebase handles token refresh automatically, even with 400 errors

// Suppress Google Sign-In COOP warnings (they're harmless but noisy)
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args[0]?.toString() || '';
  if (message.includes('Cross-Origin-Opener-Policy') || message.includes('postMessage')) {
    return; // Suppress COOP warnings
  }
  originalConsoleError.apply(console, args);
};

// Comment 4: Guard against duplicate listeners under hot reload
if (!window.__authUnhandledRejectionRegistered) {
  window.__authUnhandledRejectionRegistered = true;

  // Add global error listener for uncaught Firebase errors
  window.addEventListener('unhandledrejection', (event) => {
    // Log the full error object for better debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Unhandled rejection detected:', event.reason);
    }

    // Comment 3: Harden accounts:lookup error detection with normalized checks
    const reason = event.reason || {};
    const reasonMessage = String(reason.message || reason || '');
    const reasonUrl = reason.url || reason.response?.url || '';
    const reasonStatus = reason.status || reason.response?.status || reason.code;

    // Check for 400 error on accounts:lookup endpoint (indicates corrupted auth data)
    const is400Error = reasonStatus === 400 || reasonMessage.includes('400');
    const isAccountsLookup = reasonMessage.includes('accounts:lookup') || reasonUrl.includes('accounts:lookup');

    if (is400Error && isAccountsLookup) {
      console.warn('🔍 Accounts:lookup 400 error detected - admin account needs cleanup');

      // For admin account 400 errors, force a cleanup on next reload
      localStorage.setItem('forceAdminCleanup', 'true');
      console.warn('🔧 Admin cleanup scheduled for next page load');

      event.preventDefault();
      return;
    }

    // For non-400 accounts:lookup errors, just prevent console noise
    if (isAccountsLookup) {
      console.warn('Firebase accounts:lookup error caught (non-critical):', event.reason);
      // This is a known Firebase Auth internal error that doesn't affect functionality
      // Prevent it from showing in console as an unhandled error
      event.preventDefault();
    }
  });
}

// Smart Firebase data cleanup - enhanced admin account handling
const AUTH_FIX_VERSION = 'v14-admin-fix';
const lastCleanup = localStorage.getItem('authLastCleanup');

// Track 400 errors to trigger cleanup
let has400Error = false;

// Function to detect if we need cleanup
const needsCleanup = () => {
  // Check if admin cleanup was forced due to 400 error
  const forceAdminCleanup = localStorage.getItem('forceAdminCleanup');
  if (forceAdminCleanup === 'true') {
    console.warn('🔍 Admin cleanup forced due to 400 error');
    localStorage.removeItem('forceAdminCleanup');
    return true;
  }

  // Always cleanup if we detect 400 errors
  if (has400Error) {
    console.warn('🔍 Detected 400 error - forcing cleanup');
    return true;
  }

  // Check if we've done smart cleanup recently
  if (lastCleanup === AUTH_FIX_VERSION) {
    return false;
  }

  // Check for signs of corruption
  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
  if (!apiKey) return true;

  const authUserKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
  const authUser = localStorage.getItem(authUserKey);

  if (authUser) {
    try {
      const userData = JSON.parse(authUser);

      // Enhanced corruption detection for admin accounts
      const tokenManager = userData.stsTokenManager;

      // Check basic structure
      if (!userData.uid ||
          !userData.email ||
          !tokenManager ||
          userData.uid.length < 10) {
        console.warn('🔍 Detected corrupted auth data structure');
        return true;
      }

      // Check for admin account specific issues
      if (userData.email === 'kidsinmotion0@gmail.com') {
        // Admin accounts might have corrupted tokens even with valid structure
        if (!tokenManager.accessToken ||
            !tokenManager.refreshToken ||
            tokenManager.accessToken.length < 100) {
          console.warn('🔍 Detected corrupted admin account tokens');
          return true;
        }
      }

      // Check token expiration
      if (tokenManager.expirationTime && tokenManager.expirationTime < Date.now()) {
        console.warn('🔍 Detected expired tokens');
        return true;
      }

    } catch (error) {
      console.warn('🔍 Cannot parse auth data - corrupted');
      return true;
    }
  }

  return false;
};

// Only clear if actually needed
if (needsCleanup()) {
  console.log('🔧 Smart cleanup: Clearing only corrupted Firebase data...');

  // Clear only when necessary
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('firebase:') || key.startsWith('userProfile_')) {
      localStorage.removeItem(key);
    }
  });

  // Clear IndexedDB only when needed
  if (window.indexedDB) {
    ['firebaseLocalStorageDb', 'firebase-heartbeat-database'].forEach(dbName => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => console.log(`✅ Cleared ${dbName}`);
    });
  }

  localStorage.setItem('authLastCleanup', AUTH_FIX_VERSION);
  console.log('✅ Smart cleanup completed');
} else {
  console.log('🟢 Firebase auth data looks clean, preserving login state');
}

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

// IMPORTANT: Wrap setPersistence in setTimeout to allow auth object to stabilize
// This 100ms delay gives the auth object time to complete its initial internal setup
// before we attempt to configure persistence, preventing potential race conditions.
setTimeout(() => {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("Firebase Auth persistence set successfully");

      // Remove automatic token refresh to prevent corruption
      // Firebase will handle token refresh internally when needed

      // Verify Firebase auth keys are being stored in localStorage
      if (process.env.NODE_ENV !== 'production') {
        const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
        const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;

        const authUserKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
        const persistenceKey = `firebase:persistence:${apiKey}:[DEFAULT]`;
        const hostKey = `firebase:host:${projectId}.firebaseapp.com`;

        const authUserExists = !!localStorage.getItem(authUserKey);
        const persistenceExists = !!localStorage.getItem(persistenceKey);
        const hostExists = !!localStorage.getItem(hostKey);

        const keysPresent = [authUserExists, persistenceExists, hostExists].filter(Boolean).length;

        console.log('Firebase auth keys verified in localStorage:', {
          authUser: authUserExists,
          persistence: persistenceExists,
          host: hostExists,
          summary: `${keysPresent}/3 keys present`
        });
      }
    })
    .catch((error) => {
      console.warn("Failed to set auth persistence:", error.code || error);
      console.warn("Auth will still work but sessions won't persist across browser restarts");

      // Don't retry - let the user re-login if there's a persistence issue
      // Aggressive cleanup caused users to be logged out unexpectedly
    });
}, 100);
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
