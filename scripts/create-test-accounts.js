const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../backend/complete/src/main/resources/firebase-service-account.json');

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://kids-in-motion-website-b1c09-default-rtdb.firebaseio.com'
  });

  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function createTestUser(userData, authData) {
  try {
    console.log(`\nCreating ${userData.userType.toLowerCase()} test account...`);

    let user;
    try {
      // Try to create the user
      user = await auth.createUser(authData);
      console.log(`✅ Firebase Auth user created: ${user.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        // User already exists, get the existing user
        console.log(`⚠️  Firebase Auth user already exists for ${authData.email}`);
        user = await auth.getUserByEmail(authData.email);
        console.log(`✅ Using existing Firebase user: ${user.uid}`);
      } else {
        throw error;
      }
    }

    // Create or update Firestore user document
    const userDocRef = db.collection('users').doc(user.uid);
    const currentTime = Date.now();

    const firestoreUserData = {
      ...userData,
      firebaseUid: user.uid,
      createdTimestamp: currentTime,
      updatedTimestamp: currentTime
    };

    await userDocRef.set(firestoreUserData, { merge: true });
    console.log(`✅ Firestore user document created/updated for ${userData.userType}`);

    return user;
  } catch (error) {
    console.error(`❌ Error creating ${userData.userType} test account:`, error.message);
    throw error;
  }
}

async function createTestAccounts() {
  try {
    console.log('🚀 Starting test account creation...\n');

    // Parent test account
    const parentAuthData = {
      email: 'parent@gmail.com',
      password: 'parent',
      displayName: 'Parent Parent',
      emailVerified: true
    };

    const parentUserData = {
      firstName: 'Parent',
      lastName: 'Parent',
      username: 'parent',
      usernameLowercase: 'parent',
      email: 'parent@gmail.com',
      phoneNumber: '4848856284',
      userType: 'PARENT',
      emailVerified: true,
      phoneVerified: false, // Set to false to test phone verification
      needsOnboarding: false // Test account has complete profile
    };

    const parentUser = await createTestUser(parentUserData, parentAuthData);

    // Volunteer test account
    const volunteerAuthData = {
      email: 'volunteer@gmail.com',
      password: 'volunteer',
      displayName: 'Volunteer Volunteer',
      emailVerified: true
    };

    const volunteerUserData = {
      firstName: 'Volunteer',
      lastName: 'Volunteer',
      username: 'volunteer',
      usernameLowercase: 'volunteer',
      email: 'volunteer@gmail.com',
      phoneNumber: '4848856284',
      userType: 'VOLUNTEER',
      emailVerified: true,
      phoneVerified: false, // Set to false to test phone verification
      needsOnboarding: false // Test account has complete profile
    };

    const volunteerUser = await createTestUser(volunteerUserData, volunteerAuthData);

    console.log('\n🎉 Test account creation completed successfully!');
    console.log('\n📋 Test Account Summary:');
    console.log('==========================================');
    console.log('Parent Account:');
    console.log('  Email: parent@gmail.com');
    console.log('  Password: parent');
    console.log('  Username: parent');
    console.log('  Phone: 4848856284');
    console.log('  Firebase UID:', parentUser.uid);
    console.log('');
    console.log('Volunteer Account:');
    console.log('  Email: volunteer@gmail.com');
    console.log('  Password: volunteer');
    console.log('  Username: volunteer');
    console.log('  Phone: 4848856284');
    console.log('  Firebase UID:', volunteerUser.uid);
    console.log('==========================================');

    console.log('\n✨ Both accounts are ready for testing!');
    console.log('📝 Note: Phone verification is set to false for both accounts to test the verification system.');

  } catch (error) {
    console.error('\n💥 Failed to create test accounts:', error.message);
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  createTestAccounts()
    .then(() => {
      console.log('\n👋 Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestAccounts };