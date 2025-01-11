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
    messagingSenderId:"830562866408",
    appId: "1:830562866408:web:f432f86d8405546413655d",
    measurementId:"G-4FRNZTREY5" 
});

// Initialize Messaging
const messaging = firebase.messaging();

// Background Notification Handler
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png' // Optional: Add your icon
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
