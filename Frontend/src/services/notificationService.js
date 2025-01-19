import { messaging } from '../Firebase/firebase'
import { getToken, onMessage } from "firebase/messaging";

const CHEF_NOTIFICATIONS_KEY = "chef_notifications";

export const initializeNotifications = () => {
    if (!localStorage.getItem(CHEF_NOTIFICATIONS_KEY)) {
        localStorage.setItem(CHEF_NOTIFICATIONS_KEY, JSON.stringify([]));
        console.log("🔑 Initialized chef notifications in localStorage.");
    }
};

// Save notification with type to localStorage
export const saveNotification = (notification) => {
    try {
        console.log("Saving notification:", notification);  // Debug log

        const existingNotifications = JSON.parse(localStorage.getItem(CHEF_NOTIFICATIONS_KEY)) || [];

        // Check for duplicates based on notification_id
        const isDuplicate = existingNotifications.some(
            (notif) => notif.data?.notification_id === notification.data?.notification_id
        );

        if (isDuplicate) {
            console.warn("Duplicate notification detected. Skipping save.");
            return; // Skip saving if it's a duplicate
        }

        // Save new notification at the top
        existingNotifications.unshift(notification);
        localStorage.setItem(CHEF_NOTIFICATIONS_KEY, JSON.stringify(existingNotifications));

        console.log("Notification saved successfully.");
    } catch (err) {
        console.error("Failed to save notification:", err);
    }
};



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

// Listen for foreground messages
export const listenForMessages = () => {
    onMessage(messaging, (payload) => {
        console.log('📲 Foreground Notification:', payload);


        const { notification, data } = payload;

        // Guard against missing notification or data
        if (!notification) {
            console.warn("Notification payload is missing.");
            return;
        }

        const formattedNotification = {
            title: notification.title || "No Title",
            body: notification.body || "No Content",
            type: data?.type || "General",
            timestamp: new Date().toISOString(),
            data: data || {},
        };

        // Save the notification
        saveNotification(formattedNotification);
        // Optional alert
        alert(`[${notification.type}] ${notification.title}: ${notification.body}`);
    });
};

// Get stored notifications
export const getStoredNotifications = () => {
    return JSON.parse(localStorage.getItem(CHEF_NOTIFICATIONS_KEY)) || [];
};

// Clear notifications
// Clear a specific notification by ID
export const clearNotification = (notificationId) => {
    try {
        const existingNotifications = JSON.parse(localStorage.getItem(CHEF_NOTIFICATIONS_KEY)) || [];

        // Filter out the notification with the matching ID
        const updatedNotifications = existingNotifications.filter(
            (notif) => notif.data.notification_id !== notificationId
        );

        // Save the updated notifications back to localStorage
        localStorage.setItem(CHEF_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));

        console.log(`Notification with ID ${notificationId} cleared.`);
    } catch (err) {
        console.error("Failed to clear notification:", err);
    }
};
