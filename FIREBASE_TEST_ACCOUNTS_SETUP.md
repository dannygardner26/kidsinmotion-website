# Firebase Test Accounts Setup

This document provides instructions for setting up test accounts for the Kids in Motion website testing and development.

## Test Account Types

### 1. Admin Test Account
- **Email**: `test-admin@kidsinmotionpa.org`
- **Password**: `TestAdmin123!`
- **Role**: ADMIN
- **Permissions**: Full access to all features
- **Usage**: Testing admin functionalities like user management, event creation, and system administration

### 2. Parent Test Account
- **Email**: `parent@gmail.com`
- **Password**: `parent`
- **Username**: `parent`
- **Phone**: `4848856284`
- **First Name**: `Parent`
- **Last Name**: `Parent`
- **Role**: USER
- **Type**: Parent/Guardian
- **Usage**: Testing child registration, parent dashboard features, and family-oriented functionality

### 3. Volunteer Test Account
- **Email**: `volunteer@gmail.com`
- **Password**: `volunteer`
- **Username**: `volunteer`
- **Phone**: `4848856284`
- **First Name**: `Volunteer`
- **Last Name**: `Volunteer`
- **Role**: USER
- **Type**: Volunteer
- **Usage**: Testing volunteer signup, event management from volunteer perspective

## Firebase Console Setup

### Creating Test Accounts in Firebase Authentication

1. **Access Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select the Kids in Motion project: `kids-in-motion-website-b1c09`

2. **Navigate to Authentication**
   - In the left sidebar, click on "Authentication"
   - Click on the "Users" tab

3. **Add Each Test User**
   For each test account:

   a. Click "Add user" button

   b. For Parent Account:
      - **Email**: `parent@gmail.com`
      - **Password**: `parent`
      - **User UID**: Leave auto-generated

   c. For Volunteer Account:
      - **Email**: `volunteer@gmail.com`
      - **Password**: `volunteer`
      - **User UID**: Leave auto-generated

   d. Click "Add user"

   e. After creation, click on the user to edit:
      - Check "Email verified" if you want to skip email verification during testing
      - Add custom claims if needed (see Custom Claims section below)

## Automated Test Account Creation

### Using the Create Test Accounts Script

For convenience, you can use the automated script to create both test accounts:

**Prerequisites:**
- Firebase Admin SDK service account JSON must be present at: `backend/complete/src/main/resources/firebase-service-account.json`
- Node.js installed on your system

**Command:**
```bash
node scripts/create-test-accounts.js
```

**Script Features:**
- Creates both Parent and Volunteer test accounts
- Sets up Firebase Authentication users with email verification enabled
- Creates corresponding Firestore user documents with complete profile data
- Handles existing accounts gracefully (updates instead of failing)
- Phone verification set to false for testing the verification system

**Expected Output:**
```
🚀 Starting test account creation...

Creating parent test account...
✅ Firebase Auth user created: [Firebase UID]
✅ Firestore user document created/updated for PARENT

Creating volunteer test account...
✅ Firebase Auth user created: [Firebase UID]
✅ Firestore user document created/updated for VOLUNTEER

🎉 Test account creation completed successfully!
```

**Safe Re-running:**
The script can be run multiple times safely. If accounts already exist, it will update the Firestore documents instead of failing.

### Setting Custom Claims (Admin Accounts)

For the admin test account, you may need to set custom claims:

1. **Using Firebase CLI** (Recommended):
   ```bash
   firebase functions:shell

   # In the shell, run:
   admin.auth().setCustomUserClaims('USER_UID_HERE', {
     admin: true,
     roles: ['ROLE_USER', 'ROLE_ADMIN']
   })
   ```

2. **Using Cloud Functions** (Alternative):
   Create a one-time cloud function to set claims:
   ```javascript
   const admin = require('firebase-admin');

   exports.setAdminClaim = functions.https.onCall(async (data, context) => {
     await admin.auth().setCustomUserClaims(data.uid, {
       admin: true,
       roles: ['ROLE_USER', 'ROLE_ADMIN']
     });
     return { success: true };
   });
   ```

## Backend User Profile Setup

After creating the Firebase accounts, ensure the backend has corresponding user profiles:

### 1. Automatic Profile Creation
The application should automatically create user profiles when test users first log in through the `syncUser` endpoint.

### 2. Manual Profile Creation (If Needed)
If automatic creation fails, manually create profiles in Firestore:

1. **Access Firestore Database**
   - In Firebase Console, go to "Firestore Database"
   - Navigate to the `users` collection

2. **Create User Documents**
   For each test account, create a document with the following structure:

   ```json
   {
     "firebaseUid": "FIREBASE_USER_UID",
     "email": "test-user@kidsinmotionpa.org",
     "firstName": "Test",
     "lastName": "User",
     "username": "testuser",
     "userType": "USER", // or "ADMIN" for admin accounts
     "phoneNumber": "+1234567890",
     "address": "123 Test Street",
     "city": "Test City",
     "state": "PA",
     "zipCode": "12345",
     "isBanned": false,
     "isEmailVerified": true,
     "profileVisibility": "PUBLIC",
     "createdAt": "2024-01-01T00:00:00Z",
     "updatedAt": "2024-01-01T00:00:00Z"
   }
   ```

## Test Data Scenarios

### Events for Testing
Create test events with different scenarios:

1. **Upcoming Event** - for registration testing
2. **Past Event** - for historical data testing
3. **Full Capacity Event** - for waitlist testing
4. **Free Event** - for no-payment testing
5. **Paid Event** - for payment flow testing

### Test Children (For Parent Account)
Add test children to the parent test account:

```json
{
  "parentFirebaseUid": "PARENT_TEST_ACCOUNT_UID",
  "firstName": "Test",
  "lastName": "Child",
  "age": 8,
  "grade": "3rd",
  "allergies": "None",
  "medicalConcerns": "None",
  "emergencyContact": "Test Emergency Contact",
  "emergencyPhone": "+1987654321"
}
```

## Security Considerations

### Production vs Development
- **Development/Staging**: Use the test accounts listed above
- **Production**: Create separate test accounts with different passwords
- Never use test accounts in production environments with real user data

### Password Security
- Change default passwords before deploying to production
- Use strong, unique passwords for each test account
- Store test credentials securely (use environment variables or secure storage)

### Access Control
- Limit test account access to development and staging environments
- Regularly audit test account usage
- Remove or disable test accounts when not needed

## Using Test Accounts

### 1. Frontend Testing
Test accounts can be used directly in the login form:
- Navigate to `/login`
- Enter test account credentials
- Verify functionality based on user role

### 2. API Testing
Use test account tokens for API testing:
```javascript
// Get auth token for API requests
const user = await signInWithEmailAndPassword(auth, email, password);
const token = await user.getIdToken();

// Use token in API requests
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. Automated Testing
Include test accounts in automated test suites:
```javascript
describe('User Authentication', () => {
  it('should login admin user', async () => {
    await loginUser('test-admin@kidsinmotionpa.org', 'TestAdmin123!');
    expect(getCurrentUser().userType).toBe('ADMIN');
  });
});
```

## Troubleshooting

### Common Issues

1. **"User not found" error**
   - Verify user exists in Firebase Authentication
   - Check that email is spelled correctly
   - Ensure user is not disabled

2. **"Permission denied" error**
   - Check user roles and custom claims
   - Verify Firestore security rules
   - Ensure user profile exists in database

3. **"Email not verified" restrictions**
   - Manually verify email in Firebase Console
   - Or update security rules to allow unverified emails for test accounts

4. **Missing user profile data**
   - Trigger profile sync by logging in through the app
   - Or manually create profile in Firestore (see above)

### Support
For issues with test account setup:
1. Check Firebase Console logs
2. Review application server logs
3. Verify Firestore security rules
4. Contact development team with specific error messages

## Maintenance

### Regular Tasks
- **Monthly**: Review and update test account passwords
- **Quarterly**: Audit test account usage and permissions
- **Before releases**: Verify all test accounts work correctly
- **After updates**: Test critical user flows with each account type

### Documentation Updates
Keep this document updated when:
- Adding new test account types
- Changing test account credentials
- Updating testing procedures
- Modifying user roles or permissions

---

**Last Updated**: November 2024
**Maintained By**: Development Team
**Review Schedule**: Quarterly