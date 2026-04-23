
"use client";

import { useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { savePushSubscription } from "@/lib/actions";

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


const PwaSetup = () => {
  const { toast } = useToast();

  useEffect(() => {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js") // Using the new sw.js from the kit
        .then((registration) => {
            console.log("Service Worker registrado con éxito:", registration);
            // 2. Automatically try to subscribe if permission is already granted
            if (Notification.permission === 'granted') {
              subscribeToPushNotifications(registration);
            }
        })
        .catch((error) => console.log("Error en el registro del Service Worker:", error));
    }
  }, []);

  const subscribeToPushNotifications = async (registration: ServiceWorkerRegistration) => {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("VAPID public key not found. Skipping push subscription.");
      return;
    }

    try {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            console.log("User is already subscribed. Syncing with server.");
            // Resend subscription to server to ensure it's up to date
            await savePushSubscription(JSON.parse(JSON.stringify(existingSubscription)));
            return;
        }
        
        // If no subscription exists, create a new one.
        // This will only happen if permission was granted but subscription was lost.
        console.log("No existing subscription, creating a new one...");
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await savePushSubscription(JSON.parse(JSON.stringify(subscription)));
        console.log("New subscription created and saved.");

    } catch (error) {
        console.error("Failed to create or sync push subscription: ", error);
        // We don't toast here to avoid bothering the user on every load if something is wrong.
        // The manual button in settings is the place for user-facing errors.
    }
  }

  return null;
};

export default PwaSetup;
