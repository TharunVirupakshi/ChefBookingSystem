import { messaging } from '../Firebase/firebase'
import { getToken, onMessage } from "firebase/messaging";

export const requestPermission = async (chefId) => {
    console.log('Requesting permission...');

    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            console.log("Notification permission granted.");

            const fcmToken = await getToken(messaging);

            if (fcmToken) {
                console.log("🔑 FCM Token:", fcmToken);

                // Send token to backend (Redis)
                await fetch('http://localhost:3000/api/chefs/update-fcm-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chef_id: chefId, fcm_token: fcmToken })
                });
            } else {
                console.log("No registration token available.");
            }
        } else {
            console.warn("Permission not granted.");
        }
    } catch (err) {
        console.error("An error occurred while retrieving token:", err);
    }
};

// Listen for foreground messages
export const listenForMessages = () => {
    onMessage(messaging, (payload) => {
        console.log('📲 Foreground Notification:', payload);
        alert(`${payload.notification.title}: ${payload.notification.body}`);
    });
};
