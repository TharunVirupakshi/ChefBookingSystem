const {admin} = require('../config/firebase')
const { v4: uuidv4} = require('uuid')

// Send FCM Notification
async function sendFCMNotification(token, title, body, data = {}) {
    const notificationId = uuidv4(); 
    const message = {
        notification: { title, body },
        data: {
            ...data,
            notification_id: notificationId
        },
        token,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log(`[SUCCESS] Notification sent: ${response}`);
        return { success: true, response, notificationId };
    } catch (error) {
        console.error(`[ERROR] Failed to send notification: ${error.message}`);
        throw new Error(error)
    }
}

module.exports = { sendFCMNotification };