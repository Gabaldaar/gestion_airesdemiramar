"use client";

import { useEffect } from "react";

const PwaSetup = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Regentum PWA: Service Worker activo en:", registration.scope);
        })
        .catch((error) => {
          console.error("Regentum PWA: Error en registro del SW:", error);
        });
    }
  }, []);

  return null;
};

export default PwaSetup;
