// const {admin} = require('../config/firebase')
// const { v4: uuidv4} = require('uuid')

// // Send FCM Notification
// async function sendFCMNotification(token, title, body, data = {}) {
//     const notificationId = uuidv4(); 
//     const message = {
//         notification: { title, body },
//         data: {
//             ...data,
//             notification_id: notificationId
//         },
//         token,
//     };

//     try {
//         const response = await admin.messaging().send(message);
//         console.log(`[SUCCESS] Notification sent: ${response}`);
//         return { success: true, response, notificationId };
//     } catch (error) {
//         console.error(`[ERROR] Failed to send notification: ${error.message}`);
//         throw new Error(error)
//     }
// }

// module.exports = { sendFCMNotification };




const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Send FCM Notification
async function sendFCMNotification(token, title, body, data = {}) {
    const notificationId = uuidv4();

    // Ensure all data values are strings
    const stringifiedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)])
    );

    const message = {
        notification: { title, body },
        data: {
            ...stringifiedData,
            notification_id: notificationId,
        },
        token,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log(`[SUCCESS] Notification sent: ${response}`);
        return { success: true, response, notificationId };
    } catch (error) {
        console.error(`[ERROR] Failed to send notification: ${error.message}`);
        throw new Error(error);
    }
}

module.exports = { sendFCMNotification };
