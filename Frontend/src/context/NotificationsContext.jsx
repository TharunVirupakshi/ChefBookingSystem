import React, { createContext, useContext, useEffect, useState } from 'react';
import { messaging } from '../Firebase/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { toast } from "react-toastify";

const CHEF_NOTIFICATIONS_KEY = "chef_notifications";

// Create Context
const NotificationContext = createContext();

// Custom Hook to use Notification Context
export const    useNotification = () => useContext(NotificationContext);

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);


    // 1️⃣ Initialize Notifications in LocalStorage
    const initializeNotifications = () => {
        if (!localStorage.getItem(CHEF_NOTIFICATIONS_KEY)) {
            localStorage.setItem(CHEF_NOTIFICATIONS_KEY, JSON.stringify([]));
            console.log("🔑 Initialized chef notifications in localStorage.");
        }
    };

    // 2️⃣ Save Notification (Avoiding Duplicates)

const INSTANT_BOOKING_KEY = "instant_booking_notification";

// Save notification with type handling
const saveNotification = (notification) => {
    try {
        
        const existingNotifications =
            JSON.parse(localStorage.getItem(CHEF_NOTIFICATIONS_KEY)) || [];
        const isDuplicate = existingNotifications.some(
            (notif) => notif.data?.notification_id === notification.data?.notification_id
        );

        if (isDuplicate) {
            console.warn("Duplicate notification detected. Skipping save.");
            return;
        }

        existingNotifications.unshift(notification);
        localStorage.setItem(
            CHEF_NOTIFICATIONS_KEY,
            JSON.stringify(existingNotifications)
        );
        console.log("✅ Saved new notification:", notification);
        
    } catch (err) {
        console.error("❌ Failed to save notification:", err);
    }
};


    // 3️⃣ Get Notifications
    const getStoredNotifications = () => {
        return JSON.parse(localStorage.getItem(CHEF_NOTIFICATIONS_KEY)) || [];
    };

    // 4️⃣ Clear Specific Notification by ID
    const clearNotification = (notificationId) => {
        try {
            const existingNotifications = getStoredNotifications();

            const updatedNotifications = existingNotifications.filter(
                (notif) => notif.data.notification_id !== notificationId
            );

            localStorage.setItem(CHEF_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
            setNotifications(updatedNotifications);

            console.log(`🗑️ Notification with ID ${notificationId} cleared.`);
        } catch (err) {
            console.error("❌ Failed to clear notification:", err);
        }
    };

    // 5️⃣ Request Notification Permission and Get FCM Token
    const requestPermission = async (chefId) => {
        try {
            const permission = await Notification.requestPermission();

            if (permission === "granted") {
                console.log("🔔 Notification permission granted.");

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
                    console.warn("⚠️ No FCM token available.");
                }
            } else {
                console.warn("❗ Notification permission not granted.");
            }
        } catch (err) {
            console.error("❌ Error retrieving FCM token:", err);
        }
    };

    // 6️⃣ Listen for Foreground Messages
    const listenForMessages = () => {
        onMessage(messaging, (payload) => {
            console.log('📲 Foreground Notification:', payload);

            const { notification, data } = payload;

            if (!notification) {
                console.warn("⚠️ Notification payload is missing.");
                return;
            }

            const formattedNotification = {
                title: notification.title || "No Title",
                body: notification.body || "No Content",
                type: data?.type || "General",
                timestamp: new Date().toISOString(),
                data: data || {},
            };

            // Save notification (avoiding duplicates)
            saveNotification(formattedNotification);
            
            const notifs = getStoredNotifications()
            setNotifications(notifs)

            // Optional: Immediate alert
            // alert(`[${formattedNotification.type}] ${formattedNotification.title}: ${formattedNotification.body}`);
            toast.info(
            `[${formattedNotification.type}] ${formattedNotification.title}: ${formattedNotification.body}`,
            { position: "top-right", autoClose: 5000 }
        ); 
        });
    };

    // 7️⃣ Listen for Background Notifications
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'NEW_BACKGROUND_NOTIFICATION') {
                    console.log('📥 Background Notification:', event.data.payload);
                    saveNotification(event.data.payload);
                    setNotifications(getStoredNotifications())
                }
            });
        }
    }, []);

    // Initialize notifications on mount
    useEffect(() => {
        initializeNotifications();
        setNotifications(getStoredNotifications());
        listenForMessages();
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, saveNotification, clearNotification, requestPermission }}>
            {children}
        </NotificationContext.Provider>
    );
};
