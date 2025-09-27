// scripts/set-admin-claim.js
const admin = require('firebase-admin');
const serviceAccount = require('../backend/complete/src/main/resources/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const ADMIN_UID = 'hWfZYXeNS8U9miXNChbQswXU1NT2';

admin.auth().setCustomUserClaims(ADMIN_UID, { admin: true })
  .then(() => {
    console.log(`Custom claim set for ${ADMIN_UID}. Sign out/in to refresh the token.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to set claim:', err);
    process.exit(1);
  });
