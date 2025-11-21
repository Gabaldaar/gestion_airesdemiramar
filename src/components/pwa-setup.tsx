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
        .register("/sw-v2.js")
        .then((registration) => {
            console.log("Service Worker registrado con éxito:", registration);
            // 2. Request Push Notification Permission
            subscribeToPushNotifications(registration);
        })
        .catch((error) => console.log("Error en el registro del Service Worker:", error));
    }
  }, []);

  const subscribeToPushNotifications = async (registration: ServiceWorkerRegistration) => {
      // Check if permission is already granted
      if (Notification.permission === 'granted') {
          console.log('Push notification permission already granted.');
          createPushSubscription(registration);
          return;
      }
      
      // Don't request if denied, user has to manually enable it
      if (Notification.permission === 'denied') {
          console.warn('Push notification permission has been denied.');
          return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
          console.log('Push notification permission granted.');
          createPushSubscription(registration);
      } else {
          console.log('Push notification permission not granted.');
      }
  };

  const createPushSubscription = async (registration: ServiceWorkerRegistration) => {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("VAPID public key not found. Skipping push subscription.");
      return;
    }

    try {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            console.log("User is already subscribed.");
            // Optionally, resend subscription to server to ensure it's up to date
            await savePushSubscription(JSON.parse(JSON.stringify(existingSubscription)));
            return;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        console.log("User subscribed:", subscription);

        // Send the subscription to your server
        await savePushSubscription(JSON.parse(JSON.stringify(subscription)));

        toast({
            title: "Notificaciones activadas",
            description: "Recibirás recordatorios de check-in y check-out.",
        });

    } catch (error) {
        console.error("Failed to subscribe the user: ", error);
         toast({
            title: "Error de Notificaciones",
            description: "No se pudieron activar las notificaciones push.",
            variant: "destructive",
        });
    }
  }

  return null;
};

export default PwaSetup;
