/* global self, importScripts */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Initialize Firebase inside Service Worker
firebase.initializeApp({
    apiKey: "AIzaSyCVy8D-5_7hyi3ZSl-UcZdL_dEfcLBjyyE",
    authDomain: "chefbookingsys.firebaseapp.com",
    projectId: "chefbookingsys",
    storageBucket: "chefbookingsys.firebasestorage.app",
    messagingSenderId: "830562866408",
    appId: "1:830562866408:web:f432f86d8405546413655d",
    measurementId: "G-4FRNZTREY5"
});

// Initialize Messaging
const messaging = firebase.messaging();

// Helper: Send a message to all open client pages
function sendMessageToClients(message) {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
            client.postMessage(message);
        });
    });
    console.log("Triggered Clients")
}

// Handle Background Notifications
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png' // Optional: Customize the icon
    };

    // Show the notification
    self.registration.showNotification(notificationTitle, notificationOptions);

    // Prepare notification data to send to the app
    const notificationData = {
        title: payload.notification.title,
        body: payload.notification.body,
        type: payload.data?.type || "GENERAL",
        timestamp: new Date().toISOString(),
        data: payload.data || {}
    };

    // Send notification data to the app to save in localStorage
    sendMessageToClients({
        type: 'NEW_BACKGROUND_NOTIFICATION',
        payload: notificationData
    });
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                clientList[0].focus();
            } else {
                self.clients.openWindow('/');
            }
        })
    );
});
