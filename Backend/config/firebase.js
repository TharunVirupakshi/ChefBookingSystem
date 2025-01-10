const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const credPath = path.join(__dirname, "/secrets/firebase_app_cred.json")

// Check if the credentials file exists
if (!fs.existsSync(credPath)) {
    throw new Error(`[ERROR] Firebase Admin Credentials not found at ${credPath}`);
}

const cred = require(credPath)

admin.initializeApp({
credential: admin.credential.cert(cred)
});
// Success message
console.log(`[INFO] Connected to Firebase Admin`);

async function setupAdminRoles(uid) {
    if (!uid) {
        console.error('[ERROR] UID is required to assign admin role');
        return;
    }

    try {
        await admin.auth().setCustomUserClaims(uid, { admin: true });
        console.log(`[SUCCESS] Admin role assigned to user ${uid}`);
    } catch (error) {
        console.error('[ERROR] Error setting custom claims:', error.message);
    }
}

module.exports = { admin, setupAdminRoles };