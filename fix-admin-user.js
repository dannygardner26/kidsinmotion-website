// Fix admin user script
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account-private.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'kids-in-motion-website-b1c09'
});

const db = admin.firestore();

async function fixAdminUser() {
  try {
    console.log('Searching for user: kidsinmotion0@gmail.com...');

    // Query for user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', 'kidsinmotion0@gmail.com').get();

    if (snapshot.empty) {
      console.log('User not found in users collection. Checking if they need to be created...');

      // Create the user with admin privileges
      const newUser = {
        email: 'kidsinmotion0@gmail.com',
        firebaseUid: 'hWfZYXeNS8U9miXNChbQswXU1NT2', // This should be the actual Firebase UID
        firstName: 'Kids',
        lastName: 'Motion',
        userType: 'ADMIN',
        teams: ['ADMIN'],
        createdTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        updatedTimestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      await usersRef.add(newUser);
      console.log('✅ Created new admin user for kidsinmotion0@gmail.com');
    } else {
      // Update existing user
      snapshot.forEach(async (doc) => {
        console.log(`Found user document: ${doc.id}`);
        console.log('Current data:', doc.data());

        await doc.ref.update({
          userType: 'ADMIN',
          teams: ['ADMIN'],
          updatedTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Updated user to admin privileges');
      });
    }

    console.log('✅ Admin user fix completed!');
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  }
}

fixAdminUser().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});