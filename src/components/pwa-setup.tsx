"use client";

import { useEffect } from "react";

const PwaSetup = () => {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;
      // Add event listeners to handle PWA lifecycle events.
      wb.addEventListener("installed", (event) => {
        console.log(`Event ${event.type} is triggered.`);
        console.log(event);
      });

      wb.addEventListener("controlling", (event) => {
        console.log(`Event ${event.type} is triggered.`);
        console.log(event);
      });

      wb.addEventListener("activated", (event) => {
        console.log(`Event ${event.type} is triggered.`);
        console.log(event);
      });

      // A common UX pattern for progressive web apps is to show a banner when a new version of the app is available.
      // The banner notifies the user that new content is available and asks if they want to refresh the page to load it.
      // This is implemented by listening for the `waiting` event on the Workbox instance.
      wb.addEventListener("waiting", () => {
        // `event.wasWaitingBeforeRegister` will be false if this is the first time the updated service worker is waiting.
        // When `event.wasWaitingBeforeRegister` is true, a previously updated service worker is still waiting.
        // You may want to customize the UI prompt accordingly.
        // https://developer.chrome.com/docs/workbox/handling-service-worker-updates/#the-code-to-display-a-prompt
        if (confirm("A new version of the app is available. Click OK to refresh.")) {
          wb.messageSkipWaiting();
        }
      });

      // Register the service worker
      wb.register();
    }
  }, []);
  return null;
};

export default PwaSetup;
