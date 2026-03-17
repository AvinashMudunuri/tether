"use client";

import { useState, useCallback } from "react";
import { initializeApp, getApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { firebaseConfig, vapidKey, isFirebaseConfigured } from "@/lib/firebase/config";

export type UseFirebasePushResult = {
  token: string | null;
  error: string | null;
  loading: boolean;
  requestToken: () => Promise<string | null>;
};

export function useFirebasePush(): UseFirebasePushResult {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestToken = useCallback(async (): Promise<string | null> => {
    if (!isFirebaseConfigured() || !vapidKey) {
      setError("Firebase is not configured");
      return null;
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      setError("Push notifications are not supported");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission denied");
        setLoading(false);
        return null;
      }

      const app = (() => {
        try {
          return getApp();
        } catch {
          return initializeApp(firebaseConfig);
        }
      })();
      const messaging = getMessaging(app);
      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: await registerServiceWorker(),
      });

      if (currentToken) {
        setToken(currentToken);
        setLoading(false);
        return currentToken;
      }

      setError("Failed to get push token");
      setLoading(false);
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get push token";
      setError(msg);
      setLoading(false);
      return null;
    }
  }, []);

  return { token, error, loading, requestToken };
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
  if (reg) return reg;
  return navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
}
