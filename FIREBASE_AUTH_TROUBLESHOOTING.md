# Firebase Authentication Troubleshooting Guide

This guide documents common Firebase Authentication issues and their solutions for the Kids in Motion website.

## Table of Contents

1. [400 Bad Request on accounts:lookup](#400-bad-request-on-accountslookup)
2. [Cross-Origin-Opener-Policy (COOP) Warnings](#cross-origin-opener-policy-coop-warnings)
3. [Understanding Firebase Auth Initialization](#understanding-firebase-auth-initialization)
4. [Best Practices](#best-practices)
5. [Common Errors and Solutions](#common-errors-and-solutions)
6. [Testing Authentication Flow](#testing-authentication-flow)
7. [Login Persistence Testing](#login-persistence-testing)
8. [localStorage Management Best Practices](#localstorage-management-best-practices)
9. [Debugging Techniques](#debugging-techniques)

---

## 400 Bad Request on accounts:lookup

### Symptoms

- Console error during login: `POST https://identitytoolkit.googleapis.com/v1/accounts:lookup 400 (Bad Request)`
- Error occurs immediately after Firebase Auth initializes
- Login still succeeds despite the error
- Error appears intermittently, especially on first load or after clearing cache

### Root Cause

This error is caused by a **race condition** between Firebase Auth's internal initialization and API calls made by the application:

1. Firebase Auth's `onAuthStateChanged` fires when a user is detected
2. Application immediately calls `syncUserWithBackend()` to sync with the backend API
3. Backend API calls require an authentication token via `user.getIdToken()`
4. However, Firebase Auth is still completing its internal initialization (the `accounts:lookup` call)
5. This causes the 400 error because the token request happens before Firebase's internal state is ready

### The Fix

**Implemented in:** `frontend/src/context/AuthContext.js`, `frontend/src/services/api.js`

The fix uses a multi-layered approach:

1. **Initialization Delay (150ms):** Added in `AuthContext.js` line 306-326
   - After `onAuthStateChanged` fires, we wait 150ms before making backend API calls
   - This allows Firebase to complete its `accounts:lookup` call
   - The delay is short enough to not impact UX but long enough to prevent the race condition

2. **Token Readiness Checks:** Added in `api.js` line 20-52
   - Before requesting a token, verify the user object has all required properties
   - Check for `uid`, `email`, `emailVerified`, and `getIdToken` function
   - Retry up to 3 times with 100ms delays if user object is incomplete

3. **Enhanced Error Handling:** Added in `AuthContext.js` line 200-224
   - Detect auth initialization errors (`auth/internal-error`, `auth/network-request-failed`)
   - Retry with exponential backoff (500ms, then 1000ms)
   - Gracefully degrade to cached profile data if backend sync fails

4. **Background Refresh:** Added in `AuthContext.js` line 106-132
   - Use cached profile immediately for instant UI rendering
   - Sync with backend in the background without blocking the UI
   - Wrapped in separate try-catch to prevent errors from affecting user experience

### Expected Behavior After Fix

- No 400 error on `accounts:lookup` during normal login flow
- Cached profiles load instantly (no delay visible to user)
- Background sync happens without blocking UI
- Retry logic handles transient network issues

### Version 8 Improvements

**Implemented:** November 9, 2025

The v8 update addresses persistent 400 errors that continued to occur despite the v7 cleanup running successfully. This suggests that timing adjustments and auto-recovery mechanisms are needed in addition to the cleanup process.

**Key Changes:**

1. **AUTH_CLEANUP_VERSION Incremented to v8** (`firebaseConfig.js` line 101)
   - Forces a fresh cleanup on next page load
   - Clears any potentially corrupted auth data that may have accumulated after v7
   - Users will experience one automatic page reload when v8 cleanup runs

2. **Auto-Recovery Mechanism** (`firebaseConfig.js` lines 43-86)
   - Enhanced unhandledrejection listener now detects 400 errors on accounts:lookup
   - Automatically increments cleanup version (e.g., v8 → v9) when 400 error detected
   - Triggers page reload to run cleanup with new version
   - Creates a self-healing system that recovers from persistent auth corruption
   - Prevents 400 errors from appearing in console (uses event.preventDefault())

3. **Increased Initialization Delay to 500ms** (`AuthContext.js` line 342)
   - Previously 300ms, now 500ms before syncing with backend
   - Gives Firebase Auth more time to complete accounts:lookup call
   - Reduces race conditions on slower connections or devices
   - Includes detailed comment explaining why the delay is necessary

4. **setPersistence Stabilization Delay** (`firebaseConfig.js` lines 200-225)
   - Wrapped setPersistence in 100ms setTimeout
   - Allows auth object to complete initial setup before configuring persistence
   - Prevents potential race conditions during auth initialization
   - Retry logic preserved within the setTimeout wrapper

5. **Enhanced localStorage Verification Logging**
   - `firebaseConfig.js` lines 208-229: Logs Firebase key presence after persistence is set
   - `AuthContext.js` lines 343-370: Logs Firebase key and profile cache presence after login
   - Both wrapped in `if (process.env.NODE_ENV !== 'production')` for development only
   - Helps diagnose persistence issues by confirming keys are stored correctly
   - Provides warnings if critical keys are missing

**Why These Changes Were Necessary:**

Despite v7 cleanup running successfully, users continued to experience 400 errors. Analysis showed:
- The 300ms delay was insufficient on some devices/connections
- No automatic recovery mechanism existed for persistent corruption
- setPersistence race conditions could cause intermittent failures
- Lack of verification logging made it difficult to diagnose persistence issues

**What This Means for Users:**

- First load after deployment: One automatic page reload as v8 cleanup runs
- If 400 error occurs after v8: Automatic recovery increments to v9 and reloads
- Login should be more reliable on slower connections (500ms buffer)
- Developers get detailed logging to diagnose any remaining issues

---

## Auto-Recovery from 400 Errors

This section documents the automatic recovery mechanism that detects and fixes corrupted Firebase auth data when 400 errors occur on the accounts:lookup endpoint.

### How Auto-Recovery Works

**Implemented in:** `frontend/src/firebaseConfig.js` lines 43-86

The auto-recovery mechanism uses a global `unhandledrejection` event listener to intercept Firebase auth errors before they reach the console:

1. **Error Detection:**
   - Listener catches all unhandled promise rejections
   - Checks if error is a 400 status code (Bad Request)
   - Checks if error message includes "accounts:lookup"
   - Both conditions must be true to trigger auto-recovery

2. **Version Increment:**
   - Reads current `authCleanupVersion` from localStorage
   - Extracts version number (e.g., "v8" → 8)
   - Increments to next version (8 → 9)
   - Saves new version to localStorage (e.g., "v9")

3. **Page Reload:**
   - Calls `window.location.reload()` to reload the page
   - On reload, the cleanup logic detects version mismatch (v8 ≠ v9)
   - Full cleanup runs: removes all `firebase:` keys, deletes IndexedDB databases
   - Page reloads again with clean auth state
   - User can now log in without 400 errors

4. **Console Management:**
   - Uses `event.preventDefault()` to suppress error from appearing in console
   - Logs helpful messages explaining the auto-recovery process
   - Shows version transition (e.g., "v8 → v9")

**Code Flow:**

```javascript
window.addEventListener('unhandledrejection', (event) => {
  // Detect 400 error on accounts:lookup
  if (is400Error && isAccountsLookup) {
    // Get current version
    const currentVersion = localStorage.getItem('authCleanupVersion'); // "v8"
    const versionNumber = parseInt(currentVersion.replace('v', '')); // 8
    const nextVersion = `v${versionNumber + 1}`; // "v9"

    // Save new version
    localStorage.setItem('authCleanupVersion', nextVersion);

    // Reload page (triggers cleanup on next load)
    window.location.reload();
  }
});
```

### When Auto-Recovery Triggers

Auto-recovery activates automatically in these scenarios:

1. **Initial Page Load with Corrupted Data:**
   - User has corrupted `firebase:authUser` key in localStorage
   - Firebase attempts to validate the corrupted data
   - accounts:lookup API call returns 400 error
   - Auto-recovery triggers immediately

2. **After Browser Updates:**
   - Browser update changes how IndexedDB or localStorage works
   - Existing Firebase auth data becomes incompatible
   - 400 error occurs on next login attempt
   - Auto-recovery clears incompatible data

3. **After Cache Corruption:**
   - Browser cache becomes corrupted due to crash or disk errors
   - Firebase auth keys contain invalid data
   - accounts:lookup fails with 400 error
   - Auto-recovery restores clean state

4. **When Firebase Auth State Becomes Inconsistent:**
   - Race conditions or interrupted operations leave auth in bad state
   - Firebase's internal validation detects the inconsistency
   - 400 error is thrown during initialization
   - Auto-recovery resolves the inconsistency

**Important:** Auto-recovery should only trigger once per corruption event. If it triggers repeatedly (multiple reloads), this indicates a deeper issue that needs investigation.

### What Happens During Auto-Recovery

**Step-by-Step Process:**

1. **Error Detected (Instant):**
   ```
   Console: "🔍 Corrupted auth data detected (400 error on accounts:lookup)"
   Console: "📋 Auto-recovery: Incrementing cleanup version and reloading..."
   ```

2. **Version Incremented (Instant):**
   ```
   localStorage.authCleanupVersion: "v8" → "v9"
   Console: "✅ Cleanup version updated: v8 → v9"
   ```

3. **Page Reloads (1-2 seconds):**
   - Page reloads automatically
   - User sees brief loading screen

4. **Cleanup Runs (On Reload):**
   ```
   Console: "🔥 Running one-time auth cleanup to fix 400 errors..."
   Console: "Removing Firebase key: firebase:authUser:..."
   Console: "Removing Firebase key: firebase:persistence:..."
   Console: "Removed 3 Firebase keys from localStorage"
   Console: "✅ Cleared firebaseLocalStorageDb"
   Console: "✅ Auth cleanup complete. Reloading page for clean start..."
   ```

5. **Page Reloads Again (1-2 seconds):**
   - Second reload ensures Firebase starts with completely clean state
   - No corrupted data remains

6. **Normal Operation Resumes:**
   ```
   Console: "⏭️ Cleanup already ran for this version, skipping."
   Console: "Firebase App initialized"
   Console: "Firebase Auth initializing..."
   ```

**Total Time:** Approximately 2-4 seconds from error to clean state

**User Experience:**
- User sees two quick page reloads
- No manual intervention required
- After reloads, login works normally
- No data loss (only Firebase auth keys are cleared)

### Verifying Auto-Recovery Worked

After auto-recovery completes, verify the system is working correctly:

1. **Check Console Logs:**
   ```
   Look for: "🔍 Corrupted auth data detected"
   Look for: "✅ Cleanup version updated: v8 → v9"
   Look for: "🔥 Running one-time auth cleanup..."
   Look for: "⏭️ Cleanup already ran for this version, skipping"
   ```

2. **Check localStorage:**
   - Open DevTools → Application → Local Storage
   - Verify `authCleanupVersion` shows the new version (e.g., "v9")
   - Verify no `firebase:` keys exist before login
   - Login and verify `firebase:authUser` and `firebase:persistence` keys appear

3. **Verify No More 400 Errors:**
   - Open DevTools → Console
   - Clear console
   - Login with any method (email/password or Google)
   - Verify no 400 errors on accounts:lookup
   - Verify login completes successfully

4. **Check Network Tab:**
   - Open DevTools → Network tab
   - Filter for "accounts:lookup"
   - All requests should show 200 OK status (not 400)

5. **Test Login Persistence:**
   - Login successfully
   - Close browser completely
   - Reopen browser and navigate to site
   - Should remain logged in (no 400 errors on session restoration)

**Expected Console Output After Successful Recovery:**

```
⏭️ Cleanup already ran for this version, skipping.
Firebase App initialized
Firebase Auth initializing...
Firebase Auth persistence set successfully
Firebase auth keys verified in localStorage: {authUser: true, persistence: true, host: true, summary: "3/3 keys present"}
Auth State Changed: User UID: xxxxx
Waiting 500ms for Firebase Auth to complete initialization...
Initialization delay complete, syncing user with backend...
Login persistence verification: {firebaseAuthUser: true, firebasePersistence: true, profileCache: true, summary: "Firebase keys: 2/2, Profile cache: yes"}
```

---

## Cross-Origin-Opener-Policy (COOP) Warnings

### Symptoms

Console warnings like:
```
Cross-Origin-Opener-Policy policy would block the window.postMessage call.
```

### Is This a Problem?

**No.** These warnings are **expected behavior** and do not affect functionality.

### Why They Occur

Google Identity Services (used for Google Sign-In) uses iframes and popups for authentication. Modern browsers show COOP warnings when these cross-origin communications occur as a security measure to inform developers about potential security considerations.

### What Was Done

**Implemented in:** `frontend/src/pages/Login.jsx` line 226-230

Added documentation comment explaining:
- COOP warnings are expected when using Google One Tap
- They are caused by Google Identity Services' iframe/popup usage
- They do not affect functionality and can be safely ignored
- Reference to official Google documentation

### Can We Eliminate These Warnings?

No, not without switching authentication methods. Google One Tap is the recommended approach by Google for the best user experience. The warnings are informational only.

### Validating COOP Warnings Don't Affect Functionality

To confirm that COOP warnings are truly harmless and don't interfere with authentication:

1. **Complete Google Sign-In Successfully:**
   - Click "Sign in with Google"
   - Observe COOP warnings in console (expected)
   - Verify authentication completes and you receive the ID token

2. **Verify Redirect to Dashboard:**
   - After Google Sign-In, you should be redirected to the dashboard
   - The redirect should happen smoothly despite the warnings

3. **Verify User Profile Loads Correctly:**
   - Check that user profile information displays properly
   - Verify cached profile loads instantly
   - Confirm background sync completes

4. **Confirm Login Persists Across Browser Restarts:**
   - Close browser completely
   - Reopen browser and navigate to site
   - You should remain logged in despite the COOP warnings

5. **Note Warnings Appear but Don't Block Operations:**
   - Warnings are informational messages from the browser
   - They don't throw errors or prevent any operations
   - All authentication flows complete successfully

---

## Understanding Firebase Auth Initialization

### Initialization Sequence

Documented in `frontend/src/firebaseConfig.js` lines 8-23:

```
1. Firebase App initializes (synchronous)
   ↓
2. Auth initializes (begins async internal initialization)
   ↓
3. Persistence is set (affects how auth state is stored)
   ↓
4. Firestore initializes with offline cache
   ↓
5. Auth completes internal initialization (accounts:lookup API call)
   ↓
6. onAuthStateChanged fires when auth state is detected
```

### Timeline Diagram

```
Time (ms)  Event
─────────────────────────────────────────────────────────
0          Firebase App created
0          getAuth(app) called → auth object created
0          setPersistence() called
10         Firestore initialized
50-150     Firebase Auth internal initialization
           - Makes accounts:lookup API call
           - Verifies user tokens
           - Loads user metadata
150-200    onAuthStateChanged fires (user detected)
200-350    Safe to call getIdToken() and make API requests
```

### Why Immediate API Calls Fail

The `auth.currentUser` object exists immediately after `getAuth()`, but:
- User properties may not be fully populated
- Token generation may not be ready
- Internal Firebase state may still be initializing

**Solution:** Always wait for `onAuthStateChanged` to fire, then add a small delay (150ms) before making API calls.

---

## Best Practices

### 1. Always Use onAuthStateChanged

```javascript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Add delay before making API calls
      setTimeout(async () => {
        await syncUserWithBackend(user);
      }, 150);
    }
  });
  return () => unsubscribe();
}, []);
```

### 2. Add Delays Before API Calls on Initial Auth

When `onAuthStateChanged` fires with a user:
- Wait 150ms before calling backend APIs
- This allows Firebase to complete its internal initialization
- Use `setTimeout` to defer the sync

### 3. Use Cached Data When Available

```javascript
const cachedProfile = localStorage.getItem(`userProfile_${user.uid}`);
if (cachedProfile) {
  setUserProfile(JSON.parse(cachedProfile));
  setAuthReady(true); // Unblock UI immediately

  // Refresh in background
  (async () => {
    try {
      const freshProfile = await apiService.getUserProfile();
      setUserProfile(freshProfile);
    } catch (error) {
      // Non-critical - cached data is already displayed
    }
  })();
}
```

### 4. Implement Retry Logic for Transient Errors

```javascript
const syncWithRetry = async (user, retryCount = 0) => {
  try {
    await apiService.syncUser();
  } catch (error) {
    if (isAuthError(error) && retryCount < 2) {
      const delay = retryCount === 0 ? 500 : 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return syncWithRetry(user, retryCount + 1);
    }
    throw error;
  }
};
```

### 5. Handle Auth Initialization Errors Gracefully

Never block the UI or prevent login due to backend sync failures:

```javascript
try {
  await syncUserWithBackend(user);
} catch (error) {
  console.error("Sync failed:", error);
  // Still allow app to load with cached data or without profile
  setAuthReady(true);
}
```

### 6. Implement Auto-Recovery for Persistent Errors

**When to Use Auto-Recovery:**

Auto-recovery is appropriate for specific, known error patterns that have well-defined solutions. The 400 error on accounts:lookup is a perfect example because:
- The error indicates corrupted localStorage data
- The solution is always the same (clear auth data and reload)
- User intervention would require manual cache clearing (poor UX)
- The error prevents login completely without recovery

**Pattern for Auto-Recovery:**

```javascript
window.addEventListener('unhandledrejection', (event) => {
  // Detect specific error pattern
  const isTargetError = /* check error type and context */;

  if (isTargetError) {
    // Log what's happening
    console.warn('Specific error detected, initiating auto-recovery...');

    // Apply fix (e.g., clear corrupted data, increment version)
    // ... recovery logic ...

    // Prevent error from appearing in console
    event.preventDefault();

    // Reload to apply fix
    window.location.reload();
  }
});
```

**When NOT to Use Auto-Recovery:**

1. **Network Errors:**
   - Don't auto-recover from network failures
   - Let user know their connection is down
   - Allow manual retry

2. **Backend API Errors:**
   - Don't mask 500 errors or API failures
   - Log these for debugging
   - Show user-friendly error messages

3. **Unknown Errors:**
   - Don't auto-recover from unrecognized errors
   - Could mask underlying bugs
   - Log for investigation

4. **User Data Errors:**
   - Don't auto-clear user data without explicit action
   - Could result in data loss
   - Require user confirmation

**Warning About Over-Using Auto-Recovery:**

Auto-recovery is powerful but can mask underlying issues if overused:

- **Symptom Masking:** If auto-recovery triggers frequently, it might be hiding a root cause that needs fixing
- **Infinite Loops:** Poorly implemented recovery can cause endless reload loops
- **Data Loss:** Aggressive cleanup could delete data that should be preserved
- **Debugging Difficulty:** Automatic fixes make it harder to reproduce and debug issues

**Best Practice Guidelines:**

1. **Limit to Specific Errors:**
   - Only implement recovery for well-understood error patterns
   - Don't create a generic "recover from everything" handler

2. **Add Safeguards:**
   - Track how many times recovery has run (localStorage counter)
   - If recovery runs more than twice in a session, log a warning and stop
   - This prevents infinite loops

3. **Log Everything:**
   - Always log when auto-recovery triggers
   - Include error details, recovery action taken, and timestamp
   - This helps identify if recovery is masking a deeper problem

4. **Monitor in Production:**
   - Track how often auto-recovery triggers in production
   - High frequency indicates an underlying issue that needs fixing
   - Consider adding telemetry to monitor recovery events

5. **Document Expected Behavior:**
   - Document when recovery should trigger
   - Document what recovery does
   - Document what happens after recovery completes
   - Make it easy for other developers to understand

**Example of Safe Auto-Recovery with Safeguards:**

```javascript
// Track recovery attempts in session
const getRecoveryCount = () => {
  return parseInt(sessionStorage.getItem('authRecoveryCount') || '0');
};

const incrementRecoveryCount = () => {
  const count = getRecoveryCount() + 1;
  sessionStorage.setItem('authRecoveryCount', count.toString());
  return count;
};

window.addEventListener('unhandledrejection', (event) => {
  const is400Error = /* ... */;
  const isAccountsLookup = /* ... */;

  if (is400Error && isAccountsLookup) {
    // Check if we've already recovered too many times
    const recoveryCount = getRecoveryCount();
    if (recoveryCount >= 2) {
      console.error('Auto-recovery triggered too many times. Manual intervention required.');
      console.error('Please clear browser cache and try again.');
      return; // Don't recover again
    }

    // Increment counter
    incrementRecoveryCount();

    // Proceed with recovery
    console.warn('Corrupted auth data detected, auto-recovery in progress...');
    // ... rest of recovery logic ...
  }
});
```

**Reference Implementation:**

See `firebaseConfig.js` lines 43-86 for the production implementation of auto-recovery for 400 errors on accounts:lookup.

---

## Common Errors and Solutions

### Error: `auth/internal-error`

**Cause:** Firebase Auth is still initializing internally.

**Solution:**
- Wait 200ms and retry
- Implemented in `api.js` lines 86-100

**Code:**
```javascript
if (errorCode === 'auth/internal-error') {
  await new Promise(resolve => setTimeout(resolve, 200));
  return await user.getIdToken(true); // Force refresh
}
```

---

### Error: `auth/network-request-failed`

**Cause:** Network connectivity issue.

**Solution:**
- Display user-friendly message
- Don't retry immediately (network might be down)
- Let user manually retry

**Code:**
```javascript
if (errorCode === 'auth/network-request-failed') {
  throw new Error('Network error. Please check your internet connection.');
}
```

---

### Error: `auth/user-token-expired`

**Cause:** User's Firebase token has expired (usually after 1 hour).

**Solution:**
- Force refresh the token
- Implemented in `api.js` lines 103-108

**Code:**
```javascript
if (errorCode === 'auth/user-token-expired') {
  return await user.getIdToken(true); // Force refresh
}
```

---

### Error: "Firebase Auth not fully initialized"

**Cause:** Attempting to get token before auth is ready.

**Solution:**
- Call `waitForAuthReady()` before token requests
- Implemented in `api.js` lines 20-52

---

## Testing Authentication Flow

### How to Test Login with Email/Password

1. Open browser DevTools → Console
2. Navigate to login page
3. Enter credentials and submit
4. Watch console logs for initialization sequence:
   ```
   Firebase App initialized
   Firebase Auth initializing...
   Auth State Changed: User UID: xxxxx
   Waiting 150ms for Firebase Auth to complete initialization...
   Initialization delay complete, syncing user with backend...
   [api] Firebase Auth is ready
   Using cached user profile: {...}
   ```

5. Verify no 400 error on `accounts:lookup`
6. Verify redirect to dashboard

### How to Test Google Sign-In

1. Open browser DevTools → Console
2. Navigate to login page
3. Click "Sign in with Google"
4. Watch for COOP warnings (expected)
5. Complete Google authentication
6. Verify same initialization sequence as email/password
7. Verify no 400 error
8. Verify redirect to dashboard

### How to Test with Test Accounts

Development mode only (set `NODE_ENV=development`):

1. **Test Parent Account:**
   - Click "Test Parent" button
   - Credentials: `parent@gmail.com` / `parent`

2. **Test Volunteer Account:**
   - Click "Test Volunteer" button
   - Credentials: `volunteer@gmail.com` / `volunteer`

3. **Test Admin Account:**
   - Email: `kidsinmotion0@gmail.com` / `admin123`
   - Or: `kidsinmotion@gmail.com` / `admin123`

### How to Verify Auth Initialization Timing

1. Open DevTools → Console
2. Enable timestamps: Console settings → Show timestamps
3. Watch for timing between these logs:
   ```
   [timestamp] Firebase Auth initializing...
   [timestamp] Auth State Changed: User UID: xxxxx
   [timestamp] Waiting 150ms for Firebase Auth to complete initialization...
   [timestamp] [api] Firebase Auth is ready
   ```
4. Verify ~150-200ms gap between "Auth State Changed" and "Firebase Auth is ready"

### How to Check for Race Conditions

1. **Clear browser cache completely** (Ctrl+Shift+Delete)
2. **Close all browser tabs** for the site
3. **Restart browser**
4. Navigate to site and log in
5. Watch console for 400 errors on `accounts:lookup`
6. If 400 error appears, the race condition is still present

### Testing the 500ms Initialization Delay

**Purpose:** Verify the increased initialization delay is preventing 400 errors on accounts:lookup.

**Steps:**

1. **Open DevTools Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Enable timestamps: Console settings → Show timestamps

2. **Navigate to Login Page:**
   - Go to the login page
   - Watch for initial Firebase initialization logs

3. **Complete Login:**
   - Enter credentials and submit
   - Or click "Sign in with Google"

4. **Watch for Delay Log:**
   - Look for: `"Waiting 500ms for Firebase Auth to complete initialization..."`
   - This should appear immediately after `"Auth State Changed: User UID: xxxxx"`

5. **Verify Timing:**
   - Note timestamp when "Auth State Changed" logs
   - Note timestamp when "Initialization delay complete, syncing user with backend..." logs
   - Difference should be ~500ms

6. **Verify No 400 Errors:**
   - Open Network tab
   - Filter for "accounts:lookup"
   - All requests should show 200 OK (not 400)
   - If 400 appears, the delay may need to be increased further

**Expected Console Output:**
```
[10:23:45.123] Auth State Changed: User UID: abc123xyz
[10:23:45.125] Waiting 500ms for Firebase Auth to complete initialization...
[10:23:45.625] Initialization delay complete, syncing user with backend...
```

**What to Look For:**
- Gap between "Auth State Changed" and "Initialization delay complete" should be ~500ms
- No 400 errors should appear in console or Network tab
- Login should complete successfully without errors

### Testing setPersistence Stabilization

**Purpose:** Verify the 100ms delay before setPersistence is preventing race conditions.

**Steps:**

1. **Clear All Auth Data:**
   - Open DevTools → Console
   - Run: `Object.keys(localStorage).forEach(k => k.startsWith('firebase:') && localStorage.removeItem(k))`
   - This clears Firebase keys for a fresh test

2. **Reload Page:**
   - Press F5 or Ctrl+R to reload
   - Watch console logs

3. **Watch for Persistence Log:**
   - Look for: `"Firebase Auth persistence set successfully"`
   - This should appear ~100ms after `"Firebase Auth initializing..."`

4. **Verify localStorage Keys:**
   - After persistence is set, check for verification logs
   - Look for: `"Firebase auth keys verified in localStorage: {authUser: false, persistence: true, host: false, summary: "1/3 keys present"}"`
   - Note: `authUser` will be false until login, but `persistence` should be true

5. **Verify No Persistence Errors:**
   - Look for: `"Failed to set auth persistence"`
   - This should NOT appear if stabilization is working

**Expected Console Output:**
```
[10:23:45.100] Firebase Auth initializing...
[10:23:45.200] Firebase Auth persistence set successfully
[10:23:45.201] Firebase auth keys verified in localStorage: {authUser: false, persistence: true, host: true, summary: "2/3 keys present"}
```

**What to Look For:**
- Persistence sets successfully without errors
- localStorage verification shows `persistence: true`
- No "Failed to set auth persistence" warnings

### Testing Auto-Recovery Mechanism

**Purpose:** Verify auto-recovery kicks in when 400 errors are detected.

**Important:** This test intentionally creates a 400 error to test recovery. Only do this in development.

**Steps:**

1. **Prepare for Test:**
   - Open DevTools → Console
   - Clear console (Ctrl+L)
   - Ensure you're in development mode (NODE_ENV !== 'production')

2. **Manually Corrupt Auth Data (Optional):**
   - If you want to test recovery, you can manually set a bad value:
   - Run: `localStorage.setItem('firebase:authUser:YOUR_API_KEY:[DEFAULT]', 'corrupted_data')`
   - Replace YOUR_API_KEY with your actual API key from .env

3. **Reload Page:**
   - Press F5 or Ctrl+R
   - Firebase will attempt to load the corrupted data

4. **Watch for Auto-Recovery Logs:**
   - Look for: `"🔍 Corrupted auth data detected (400 error on accounts:lookup)"`
   - Look for: `"📋 Auto-recovery: Incrementing cleanup version and reloading..."`
   - Look for: `"✅ Cleanup version updated: v8 → v9"` (version numbers may vary)

5. **Observe Page Reloads:**
   - Page should reload automatically (1st reload)
   - You should see cleanup logs: `"🔥 Running one-time auth cleanup..."`
   - Page should reload again (2nd reload)

6. **Verify System Back to Normal:**
   - After 2nd reload, look for: `"⏭️ Cleanup already ran for this version, skipping."`
   - No more 400 errors should appear
   - Login should work normally

**Expected Console Output:**
```
// First page load (with corrupted data):
Unhandled rejection detected: {message: "400 accounts:lookup", ...}
🔍 Corrupted auth data detected (400 error on accounts:lookup)
📋 Auto-recovery: Incrementing cleanup version and reloading...
✅ Cleanup version updated: v8 → v9

// After 1st reload (cleanup runs):
🔥 Running one-time auth cleanup to fix 400 errors...
Removing Firebase key: firebase:authUser:...
Removed 3 Firebase keys from localStorage
✅ Auth cleanup complete. Reloading page for clean start...

// After 2nd reload (normal operation):
⏭️ Cleanup already ran for this version, skipping.
Firebase App initialized
Firebase Auth initializing...
```

**What to Look For:**
- Auto-recovery detects 400 error automatically
- Version increments correctly (e.g., v8 → v9)
- Two page reloads occur
- System returns to normal operation after recovery
- No more 400 errors after recovery completes

**Note:** If auto-recovery triggers repeatedly (more than once), this indicates a deeper issue that needs investigation. It should only run once per corruption event.

---

## Login Persistence Testing

This section covers comprehensive testing procedures for validating login persistence across browser sessions, page refreshes, and logout scenarios.

### Testing Email/Password Login Persistence

**Purpose:** Verify that users remain logged in after closing the browser completely.

**Steps:**

1. **Initial Login:**
   - Navigate to the login page
   - Enter email and password credentials
   - Click "Sign In"
   - Verify successful login and redirect to dashboard

2. **Close Browser Completely:**
   - **IMPORTANT:** Close ALL browser windows and tabs (not just the site tab)
   - Wait a few seconds to ensure browser process terminates
   - Do NOT use Incognito/Private mode for this test

3. **Reopen Browser and Navigate to Site:**
   - Open a new browser window
   - Navigate to the website URL
   - You should be automatically logged in
   - Dashboard should load without showing the login page

4. **Verify Expected Behavior:**
   - No login page should appear
   - User should land directly on the dashboard
   - Console should show "Auth State Changed: User UID: xxxxx"
   - Profile information should load (either from cache or backend)

5. **Check localStorage Keys:**
   - Open DevTools → Application → Local Storage
   - Verify presence of these Firebase keys:
     - `firebase:authUser:[API_KEY]:[DEFAULT]` (contains user auth data)
     - `firebase:persistence:[API_KEY]:[DEFAULT]` (persistence setting)
     - `firebase:host:[PROJECT_ID].firebaseapp.com` (host configuration)
   - Verify presence of app cache keys:
     - `userProfile_[USER_UID]` (cached user profile)

6. **Check Console Logs:**
   - Look for "Auth State Changed" log with user UID immediately on page load
   - Should NOT see any login-related prompts
   - Should see "Using cached user profile" if cache exists

**Expected Result:** User remains logged in across browser restarts.

### Testing Google OAuth Login Persistence

**Purpose:** Verify that Google Sign-In sessions persist the same way as email/password login.

**Steps:**

1. **Initial Google Sign-In:**
   - Navigate to the login page
   - Click "Sign in with Google"
   - Complete Google authentication flow
   - Note: COOP warnings will appear (this is expected and harmless)
   - Verify successful login and redirect to dashboard

2. **Close Browser Completely:**
   - Close ALL browser windows and tabs
   - Wait a few seconds

3. **Reopen Browser and Navigate to Site:**
   - Open a new browser window
   - Navigate to the website URL
   - You should be automatically logged in without re-authenticating with Google

4. **Verify Persistence Works Identically to Email/Password:**
   - No Google Sign-In prompt should appear
   - Same localStorage keys should be present
   - Same console logs should appear
   - Profile should load the same way

**Expected Result:** Google OAuth sessions persist across browser restarts just like email/password sessions.

### Testing Session Restoration After Page Refresh

**Purpose:** Verify that users remain logged in when refreshing the page.

**Steps:**

1. **Login and Navigate Around:**
   - Log in with any method (email/password or Google)
   - Navigate to different pages (dashboard, events, profile, etc.)

2. **Refresh Page (F5 or Ctrl+R):**
   - Press F5 or Ctrl+R to reload the current page
   - Page should reload with user still logged in

3. **Verify Quick Profile Load:**
   - Console should show "Using cached user profile: {...}"
   - Profile information should appear instantly (no loading delay)
   - Background sync may happen after initial render

4. **Test Multiple Refreshes:**
   - Refresh 3-5 times in quick succession
   - User should remain logged in every time
   - No authentication errors should appear

**Expected Result:** User remains logged in through page refreshes with instant profile loading.

### Verifying localStorage Keys After Login

**Purpose:** Understand which keys are stored and what they contain.

**Steps:**

1. **Login Successfully:**
   - Use any login method
   - Wait for dashboard to fully load

2. **Open DevTools Storage Inspector:**
   - Open DevTools (F12)
   - Go to Application tab → Local Storage → select your domain

3. **Verify Firebase Auth Keys Present:**

   **Key Pattern:** `firebase:authUser:[API_KEY]:[DEFAULT]`
   - **Purpose:** Stores the authenticated user's information
   - **Contains:** User UID, email, display name, tokens
   - **Should Exist:** Yes (required for persistence)

   **Key Pattern:** `firebase:persistence:[API_KEY]:[DEFAULT]`
   - **Purpose:** Stores the persistence type setting
   - **Contains:** "LOCAL" (means sessions persist across browser restarts)
   - **Should Exist:** Yes (indicates persistence is enabled)

   **Key Pattern:** `firebase:host:[PROJECT_ID].firebaseapp.com`
   - **Purpose:** Stores Firebase host configuration
   - **Contains:** Host and project information
   - **Should Exist:** Yes (required for Firebase communication)

   **Key Pattern:** `firebase:authTokenSyncURL:[API_KEY]:[DEFAULT]` (optional)
   - **Purpose:** Token synchronization URL
   - **May or May Not Exist:** Optional

   **Key Pattern:** `firebase:pendingRedirect:[API_KEY]:[DEFAULT]` (temporary)
   - **Purpose:** Stores pending redirect information during OAuth flow
   - **Should Exist:** Only during active OAuth flows

4. **Verify App Cache Keys Present:**

   **Key Pattern:** `userProfile_[USER_UID]`
   - **Purpose:** Cached user profile for instant loading
   - **Contains:** User profile object (username, firstName, lastName, email, userType, etc.)
   - **Should Exist:** Yes (after first successful profile fetch)

5. **Check Key Sizes:**
   - Firebase auth keys are typically 1-5 KB
   - User profile cache is typically 0.5-2 KB
   - Large key sizes may indicate issues

**Expected Result:** All Firebase auth keys and user profile cache should be present after login.

### Verifying localStorage Keys After Logout

**Purpose:** Confirm that auth-specific keys are removed but other app data is preserved.

**Steps:**

1. **Before Logout - Document Current Keys:**
   - Open DevTools → Application → Local Storage
   - Note all keys present (screenshot or list them)

2. **Perform Logout:**
   - Click the logout button
   - Wait for redirect to login page

3. **After Logout - Check Removed Keys:**

   **Should Be REMOVED:**
   - `firebase:authUser:[API_KEY]:[DEFAULT]`
   - `firebase:persistence:[API_KEY]:[DEFAULT]`
   - `firebase:host:[PROJECT_ID].firebaseapp.com`
   - `firebase:authTokenSyncURL:[API_KEY]:[DEFAULT]`
   - `firebase:pendingRedirect:[API_KEY]:[DEFAULT]`
   - `userProfile_[USER_UID]` (the specific user's profile cache)

   **Should Be PRESERVED (if applicable):**
   - Any app settings keys (theme preferences, etc.)
   - Any non-auth related data
   - Keys not starting with `firebase:` or `userProfile_`

4. **Check Console Logs:**
   - Look for logs like "Removing Firebase auth key on logout: ..."
   - Should see 5 removal logs (one for each Firebase key)
   - Should see "Removing user profile cache on logout: userProfile_[UID]"

5. **Verify Clean Logout State:**
   - No Firebase auth keys remain
   - User is redirected to login page
   - Attempting to navigate to dashboard redirects back to login

**Expected Result:** Firebase auth keys and user profile cache are removed; other app data is preserved.

### Advanced Persistence Testing Scenarios

#### Test 1: Multiple Login/Logout Cycles

**Purpose:** Verify persistence works consistently across multiple sessions.

**Steps:**
1. Login → Close browser → Reopen (should be logged in)
2. Logout → Close browser → Reopen (should NOT be logged in)
3. Login again → Close browser → Reopen (should be logged in)
4. Repeat 3-5 times

**Expected Result:** Persistence works reliably every time.

#### Test 2: Different Browser Windows/Tabs

**Purpose:** Verify auth state synchronizes across multiple tabs.

**Steps:**
1. Login in Tab 1
2. Open Tab 2 to the same site (should be logged in)
3. Logout in Tab 1
4. Check Tab 2 (should automatically detect logout)

**Expected Result:** Auth state synchronizes across tabs.

#### Test 3: Browser Crash Recovery

**Purpose:** Verify persistence survives unexpected browser termination.

**Steps:**
1. Login successfully
2. Force-close browser using Task Manager (Windows) or Activity Monitor (Mac)
3. Reopen browser
4. Navigate to site

**Expected Result:** User should still be logged in after crash recovery.

#### Test 4: Long-Duration Sessions

**Purpose:** Verify sessions persist for extended periods.

**Steps:**
1. Login successfully
2. Close browser
3. Wait 24 hours
4. Reopen browser and navigate to site

**Expected Result:** User should still be logged in (Firebase tokens auto-refresh).

#### Test 5: Cache Clearing Impact

**Purpose:** Understand what happens when browser cache is cleared.

**Steps:**
1. Login successfully
2. Open DevTools → Clear browsing data
3. Select "Cookies and other site data" ONLY (not "Cached images and files")
4. Check if still logged in

**Expected Result:** Clearing cookies/localStorage logs user out (expected behavior).

---

## localStorage Management Best Practices

This section documents the approach taken to manage localStorage for authentication and app data, ensuring proper persistence while maintaining clean logout behavior.

### Why We Don't Clear Auth Keys on Initialization

**Problem:** Original implementation called `clearStaleAuthData()` on every app initialization, which removed Firebase auth keys from localStorage.

**Impact:** This broke login persistence because auth keys are required for Firebase to restore sessions across browser restarts.

**Solution (Implemented in `firebaseConfig.js` lines 93-98):**
- Commented out the automatic call to `clearStaleAuthData()`
- Auth keys now persist across app initializations
- The function is kept available for manual debugging but not executed automatically
- The 400 error on accounts:lookup has been resolved through other means (150ms delay in AuthContext)

**Code Change:**
```javascript
// IMPORTANT: clearStaleAuthData() is commented out to preserve login persistence.
// Auth keys should persist across sessions for users to remain logged in after closing the browser.
// This function is kept available for manual debugging or troubleshooting specific auth issues,
// but should NOT be called automatically on initialization.
// Only clear auth data explicitly when needed (e.g., during logout or when debugging auth problems).
// clearStaleAuthData();
```

### Why We Use Targeted Removal Instead of localStorage.clear()

**Problem:** Original implementation used `localStorage.clear()` on logout, which removed ALL localStorage data including:
- User profile caches
- App preferences and settings
- Any other application-specific data

**Impact:** Users lost cached data and had slower loading times on subsequent logins.

**Solution (Implemented in `AuthContext.js` lines 390-425):**
- Replace `localStorage.clear()` with targeted removal of only Firebase auth keys
- Remove only keys that start with `firebase:` (auth-specific)
- Remove only user profile caches for the logged-out user (`userProfile_[UID]`)
- Preserve all other app data

**Code Implementation:**
```javascript
// User is logged out - perform targeted localStorage cleanup
// Instead of localStorage.clear(), only remove Firebase auth keys and user profile cache
// This preserves other app data (preferences, settings, etc.)
try {
  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;

  const firebaseKeysToRemove = [
    `firebase:authUser:${apiKey}:[DEFAULT]`,
    `firebase:host:${projectId}.firebaseapp.com`,
    `firebase:persistence:${apiKey}:[DEFAULT]`,
    `firebase:authTokenSyncURL:${apiKey}:[DEFAULT]`,
    `firebase:pendingRedirect:${apiKey}:[DEFAULT]`
  ];

  firebaseKeysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log("Removing Firebase auth key on logout:", key);
      }
      localStorage.removeItem(key);
    }
  });

  // Remove all user profile caches (they start with userProfile_)
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('userProfile_')) {
      if (process.env.NODE_ENV !== 'production') {
        console.log("Removing user profile cache on logout:", key);
      }
      localStorage.removeItem(key);
    }
  });
} catch (cleanupError) {
  console.warn("Error during logout localStorage cleanup:", cleanupError);
}
```

### Skip Cleanup Until Firebase Finishes Restoring the Session

**Problem:** Firebase emits an initial `onAuthStateChanged` event with `null` before it finishes loading the persisted user from IndexedDB/localStorage. The previous cleanup logic interpreted this initial `null` as a real logout and immediately deleted every `firebase:*` key, so the follow-up event that should have restored the session no longer had any credentials to read. This manifested as "login works until I refresh" because the refresh sequence always hit the cleanup before Firebase could restore the cached user.

**Solution (Implemented in `AuthContext.js` lines 382-445):**
- Track the last authenticated UID in `lastUidRef`
- Only run the firebase key cleanup when `lastUidRef.current` exists (meaning we actually had a signed-in user)
- Skip cleanup for the initial `null` event and simply log a debug message in development
- Reset `lastUidRef.current` to `null` after a successful cleanup so the guard is ready for the next session

**Result:** Refreshes no longer purge Firebase persistence data. Users stay logged in across reloads, while explicit logouts still clear cached auth/profile data.

### When to Manually Call clearStaleAuthData()

The `clearStaleAuthData()` function is still available in `firebaseConfig.js` for manual use in specific debugging scenarios:

**Appropriate Times to Call It:**

1. **Debugging Persistent Auth Issues:**
   - User reports being stuck in a login loop
   - Auth state appears corrupted
   - Token validation repeatedly fails

2. **Troubleshooting Token Errors:**
   - Seeing consistent `auth/user-token-expired` errors
   - Backend returns 401 Unauthorized despite Firebase showing logged in
   - Token appears invalid but Firebase doesn't auto-refresh

3. **After Firebase Configuration Changes:**
   - Changed Firebase project ID
   - Updated API keys
   - Migrated to new Firebase project

**How to Manually Call It:**

Open browser DevTools console and run:
```javascript
// Access the function from firebaseConfig module
// Note: You may need to expose it via window object for manual access
// Or import it in a component and call it there
```

**DO NOT call it:**
- On every app initialization
- During normal logout flow (targeted removal handles this)
- As part of automated processes

### How the Profile Cache System Works

**Cache Key Pattern:** `userProfile_[USER_UID]`

**When Profile is Cached:**
- After first successful fetch from backend API
- After any profile update
- Stored as JSON string in localStorage

**When Cache is Used:**
- On subsequent logins
- On page refreshes while logged in
- Provides instant profile rendering (no loading delay)

**When Cache is Cleared:**
- On logout (only the logged-out user's cache)
- When user explicitly clears browser data
- NEVER cleared automatically on app initialization

**Cache Update Strategy:**
1. Load cached profile immediately (instant UI)
2. Fetch fresh profile from backend in background
3. Update cache with fresh data
4. Update UI with fresh data (if different from cache)

**Benefits:**
- Instant profile rendering on login
- Reduced backend API calls
- Better user experience (no loading spinners)
- Works offline (if backend is down, cached profile still displays)

### localStorage Key Reference

**Firebase Auth Keys (Managed by Firebase):**
- `firebase:authUser:[API_KEY]:[DEFAULT]` - User authentication data
- `firebase:persistence:[API_KEY]:[DEFAULT]` - Persistence type setting
- `firebase:host:[PROJECT_ID].firebaseapp.com` - Host configuration
- `firebase:authTokenSyncURL:[API_KEY]:[DEFAULT]` - Token sync URL (optional)
- `firebase:pendingRedirect:[API_KEY]:[DEFAULT]` - Pending OAuth redirect (temporary)

**App-Managed Keys:**
- `userProfile_[USER_UID]` - Cached user profile object
- `isTestAdmin` - Test admin mode flag (development only)
- `testUser` - Test user data (development only)

**Key Management Rules:**
1. Firebase keys should persist across app initializations
2. Firebase keys should be removed on logout
3. Profile caches should persist across app initializations
4. Profile caches should be removed on logout (specific user only)
5. Test mode keys should be removed on test logout only
6. Never use `localStorage.clear()` - always use targeted removal

### Debugging localStorage Issues

**Check What's in localStorage:**
```javascript
// Run in browser DevTools console
Object.keys(localStorage).forEach(key => {
  console.log(key, ':', localStorage.getItem(key).substring(0, 50));
});
```

**Verify Firebase Keys Exist After Login:**
```javascript
const apiKey = 'your-api-key-here';
const authKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
console.log('Auth key exists:', !!localStorage.getItem(authKey));
```

**Manually Clear All Firebase Keys (for debugging):**
```javascript
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('firebase:')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
});
```

**Manually Clear All Profile Caches:**
```javascript
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('userProfile_')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
});
```

### Verifying localStorage Keys After Login

This subsection provides console commands and guidance for checking that Firebase auth keys are properly stored after login, helping diagnose persistence issues.

**Check All localStorage Keys:**

```javascript
// Run in browser DevTools console
Object.keys(localStorage).forEach(key => {
  console.log(key, ':', localStorage.getItem(key).substring(0, 50));
});
```

**Expected Output After Login:**
```
firebase:authUser:AIza...:[DEFAULT] : {"uid":"abc123","email":"user@example.com","...
firebase:persistence:AIza...:[DEFAULT] : {"persistence":"LOCAL"}
firebase:host:kids-in-motion-website-b1c09.firebaseapp.com : {"host":"kids-in-motion-website-b1c09.firebaseapp.com"}
userProfile_abc123 : {"username":"testuser","firstName":"Test","...
```

**Check Specific Firebase Auth Keys:**

```javascript
// Replace with your actual API key and project ID
const apiKey = 'AIzaSyCFe7YIJX_0VtKYDYA7GVTMoJDeTTAufeg';
const projectId = 'kids-in-motion-website-b1c09';

const authUserKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
const persistenceKey = `firebase:persistence:${apiKey}:[DEFAULT]`;
const hostKey = `firebase:host:${projectId}.firebaseapp.com`;

console.log('Auth User Key:', !!localStorage.getItem(authUserKey));
console.log('Persistence Key:', !!localStorage.getItem(persistenceKey));
console.log('Host Key:', !!localStorage.getItem(hostKey));
```

**Expected Output:**
```
Auth User Key: true
Persistence Key: true
Host Key: true
```

**Check User Profile Cache:**

```javascript
// Replace with your actual user UID
const uid = 'abc123xyz'; // Get this from Firebase console or user.uid
const profileKey = `userProfile_${uid}`;

const profileExists = !!localStorage.getItem(profileKey);
console.log('Profile Cache Exists:', profileExists);

if (profileExists) {
  const profile = JSON.parse(localStorage.getItem(profileKey));
  console.log('Cached Profile:', profile);
}
```

**Expected Output:**
```
Profile Cache Exists: true
Cached Profile: {username: "testuser", firstName: "Test", lastName: "User", ...}
```

**Interpreting Missing Keys:**

1. **If `firebase:authUser` key is missing:**
   - **Problem:** User authentication data not persisted
   - **Impact:** Login will not persist across browser restarts
   - **Solution:** Check that `setPersistence(auth, browserLocalPersistence)` is being called successfully
   - **Check:** Look for "Firebase Auth persistence set successfully" in console

2. **If `firebase:persistence` key is missing:**
   - **Problem:** Persistence setting not saved
   - **Impact:** Firebase may use session persistence instead of local persistence
   - **Solution:** Same as above - verify setPersistence call
   - **Note:** This key is set before login, so it should exist even without logging in

3. **If `firebase:host` key is missing:**
   - **Problem:** Firebase host configuration not cached
   - **Impact:** May cause slower initialization on page loads
   - **Solution:** Usually created automatically, but verify Firebase is initializing correctly

4. **If `userProfile_[UID]` key is missing:**
   - **Problem:** User profile not cached
   - **Impact:** Slower loading on subsequent logins (requires backend API call)
   - **Solution:** Verify backend sync completes successfully
   - **Note:** This is non-critical - app will fetch from backend if missing

**Troubleshooting Steps If Keys Are Missing:**

1. **Check Console Logs:**
   - Look for "Firebase Auth persistence set successfully"
   - Look for "Firebase auth keys verified in localStorage: ..."
   - Look for "Login persistence verification: ..."

2. **Check for Errors:**
   - Look for "Failed to set auth persistence"
   - Look for any 400 errors on accounts:lookup
   - Look for any network errors

3. **Verify Environment Variables:**
   - Ensure `.env` has all required Firebase config variables
   - Verify variable names start with `REACT_APP_`
   - Restart development server after changing `.env`

4. **Test with Clean State:**
   - Clear all localStorage: `localStorage.clear()`
   - Delete all IndexedDB databases (DevTools → Application → IndexedDB)
   - Reload page and login again
   - Check if keys are created this time

5. **Reference Documentation:**
   - See `firebaseConfig.js` lines 208-229 for verification logging
   - See `AuthContext.js` lines 343-370 for login verification logging
   - See "Testing setPersistence Stabilization" section above for detailed testing procedures

---

## Debugging Techniques

### Enable Firebase Debug Logging

Add to `firebaseConfig.js`:

```javascript
import { setLogLevel } from "firebase/app";
setLogLevel('debug');
```

This shows all Firebase internal operations.

### Check Browser Console for Initialization Logs

Look for this sequence:

```
Firebase App initialized
Firebase Auth initializing...
Initializing Firestore with offline persistence...
Firestore offline persistence enabled
Auth State Changed: User UID: xxxxx
Waiting 150ms for Firebase Auth to complete initialization...
Initialization delay complete, syncing user with backend...
[api] Firebase Auth is ready
[api] GET /auth/sync-user token: xxxxxxxx...
```

### Verify Environment Variables Are Set Correctly

Check `firebaseConfig.js` logs:

```
Firebase Config Debug: {apiKey: true, authDomain: true, projectId: true}
```

All should be `true`. If any are `false`:
1. Check `.env` file has all required variables
2. Verify variable names start with `REACT_APP_`
3. Restart development server after changing `.env`

### Check Network Tab for API Call Timing

1. Open DevTools → Network tab
2. Filter for "accounts:lookup"
3. Check the timeline:
   - Should NOT appear before user is fully authenticated
   - Should NOT result in 400 error
4. Filter for "/auth/sync-user"
5. Verify it happens AFTER accounts:lookup completes

### Use Firebase Auth Emulator for Local Testing

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize emulators: `firebase init emulators`
3. Select "Authentication Emulator"
4. Start emulator: `firebase emulators:start --only auth`
5. Update `firebaseConfig.js` to use emulator:
   ```javascript
   if (process.env.NODE_ENV === 'development') {
     connectAuthEmulator(auth, 'http://localhost:9099');
   }
   ```

### Debug Token Issues

Add logging in `api.js`:

```javascript
async getAuthToken() {
  const user = auth.currentUser;
  console.log('Getting token for user:', user?.uid);
  console.log('User email verified:', user?.emailVerified);
  console.log('User has getIdToken:', typeof user?.getIdToken);

  const token = await user.getIdToken();
  console.log('Token obtained:', token.substring(0, 20) + '...');
  return token;
}
```

---

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web/guides/features)
- [COOP/COEP Explanation](https://web.dev/coop-coep/)
- [Firebase Auth State Persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)

---

## Version History

- **v1.0** (2025-01-08): Initial documentation covering 400 error fix and COOP warnings
- **v1.1** (2025-11-09): Added login persistence fix, localStorage management documentation, and comprehensive persistence testing procedures
- **v1.2** (2025-11-09): Implemented 400 error auto-recovery mechanism, increased initialization delays to 500ms, added setPersistence stabilization delay (100ms), and enhanced localStorage verification logging
