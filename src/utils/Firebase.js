"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import firebase from "firebase/compat/app";
import { getAuth } from "firebase/auth";
import { setFcmToken } from "@/redux/reducers/userDataSlice";

// Singleton instances
let firebaseApp = null;
let messagingInstancePromise = null;

const FirebaseData = () => {
  let firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGEING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MESUMENT_ID,
  };

  // Initialize App (Singleton)
  if (!firebaseApp) {
    if (!firebase.apps.length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
  }

  // Compat for legacy if needed/mixed usage
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const authentication = getAuth(firebaseApp);

  // Messaging Instance (Singleton Promise)
  const getMessagingInstance = () => {
    if (messagingInstancePromise) return messagingInstancePromise;

    messagingInstancePromise = (async () => {
      try {
        const isSupportedBrowser = await isSupported();
        if (isSupportedBrowser) {
          return getMessaging(firebaseApp);
        }
        return null;
      } catch (err) {
        console.error("Error checking messaging support:", err);
        return null;
      }
    })();
    return messagingInstancePromise;
  };

  const fetchToken = async (setTokenFound, setFcmToken) => {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.error("Messaging not supported.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        let registration = null;
        if ("serviceWorker" in navigator) {
          try {
            registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
            console.log("Service Worker registration successful with scope:", registration.scope);
          } catch (err) {
            console.error("Service Worker registration failed:", err);
          }
        }

        try {
          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (currentToken) {
            setTokenFound(true);
            setFcmToken(currentToken);
          } else {
            setTokenFound(false);
            setFcmToken(null);
          }
        } catch (err) {
          console.error("Error retrieving token:", err);
        }
      } else if (permission === "denied") {
        console.log("notification permission denied");
        setTokenFound(false);
        setFcmToken(null);
      } else {
        setTokenFound(false);
        setFcmToken(null);
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    }
  };

  const onMessageListener = async (callback) => {
    const messaging = await getMessagingInstance();
    if (messaging) {
      return onMessage(messaging, (payload) => {
        callback(payload);
      });
    } else {
      console.error("Messaging not supported.");
      return null;
    }
  };
  const signOut = () => {
    return authentication.signOut();
  };
  return { authentication, fetchToken, onMessageListener, signOut };
};

export default FirebaseData;
