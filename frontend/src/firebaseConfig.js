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
      console.warn('🔍 Accounts:lookup 400 error detected (suppressed, user stays logged in)');

      // DO NOT sign out - just suppress the error and let the user stay logged in
      // The 400 error is non-critical and doesn't affect functionality
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

// Enhanced cleanup to fix COOP header corruption and detect malformed auth data
// This runs ONCE per browser to clear corrupted auth tokens
const AUTH_FIX_VERSION = 'v12-corrupted-accounts-fix';
const authFixed = localStorage.getItem('authDataFixed');

// Function to detect corrupted auth data
const detectCorruptedAuthData = () => {
  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
  if (!apiKey) return false;

  const authUserKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
  const authUser = localStorage.getItem(authUserKey);

  if (authUser) {
    try {
      const userData = JSON.parse(authUser);
      // Check for signs of corrupted user data
      if (!userData.uid ||
          !userData.email ||
          userData.uid.length < 10 ||
          !userData.email.includes('@') ||
          !userData.stsTokenManager) {
        console.warn('🔍 Detected corrupted auth user data:', userData);
        return true;
      }

      // Check for expired or invalid tokens
      const tokenManager = userData.stsTokenManager;
      if (tokenManager.expirationTime && tokenManager.expirationTime < Date.now()) {
        console.warn('🔍 Detected expired token in localStorage');
        return true;
      }
    } catch (parseError) {
      console.warn('🔍 Cannot parse auth user data - likely corrupted:', parseError);
      return true;
    }
  }

  return false;
};

if (authFixed !== AUTH_FIX_VERSION || detectCorruptedAuthData()) {
  console.log('🔧 Clearing corrupted auth data...');

  // Remove ALL Firebase localStorage keys
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('firebase:') || key.startsWith('userProfile_')) {
      localStorage.removeItem(key);
    }
  });

  // Delete Firebase IndexedDB databases
  if (window.indexedDB) {
    ['firebaseLocalStorageDb', 'firebase-heartbeat-database', 'firebase-installations-database'].forEach(dbName => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => console.log(`✅ Cleared ${dbName}`);
      req.onerror = () => console.warn(`⚠️ Could not clear ${dbName}`);
    });
  }

  localStorage.setItem('authDataFixed', AUTH_FIX_VERSION);
  console.log('✅ Corrupted auth data cleared. Reloading for clean start...');

  // Reload once to start fresh
  window.location.reload();
  throw new Error('Reloading to apply auth fix');
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

      // Set up token refresh handler to maintain valid tokens
      const refreshToken = () => {
        if (auth.currentUser) {
          auth.currentUser.getIdToken(true).then(() => {
            console.log("Token refreshed successfully");
          }).catch(err => {
            console.warn("Token refresh failed:", err);
            // Don't force logout on token refresh failure - Firebase will handle it
          });
        }
      };

      // Refresh token every 50 minutes (tokens expire after 60 minutes)
      setInterval(refreshToken, 50 * 60 * 1000);

      // Also refresh on page focus to ensure token is fresh when user returns
      window.addEventListener('focus', () => {
        if (auth.currentUser) {
          refreshToken();
        }
      });

      // Force token refresh on page load to prevent TOKEN_EXPIRED errors
      if (auth.currentUser) {
        refreshToken();
      }

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
