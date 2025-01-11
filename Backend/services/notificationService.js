const {admin} = require('../config/firebase')

// Send FCM Notification
async function sendFCMNotification(token, title, body, data = {}) {
    const message = {
        notification: { title, body },
        data,
        token,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log(`[SUCCESS] Notification sent: ${response}`);
        return { success: true, response };
    } catch (error) {
        console.error(`[ERROR] Failed to send notification: ${error.message}`);
        return { success: false, error: error.message };
    }
}

module.exports = { sendFCMNotification };