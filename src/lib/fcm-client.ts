"use client";

import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const FCM_SW_PATH = "/firebase-messaging-sw.js";

async function ensureFcmServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration(FCM_SW_PATH);
  if (existing?.active) return existing;
  try {
    return await navigator.serviceWorker.register(FCM_SW_PATH, { scope: "/" });
  } catch (e) {
    console.warn("[FCM] service worker:", e);
    return null;
  }
}

/**
 * Regista token FCM do dispositivo (PWA/celular) no perfil do utilizador.
 * Requer `NEXT_PUBLIC_FIREBASE_VAPID_KEY` no .env.local (Firebase Console → Cloud Messaging → Web Push).
 */
export async function registerDeviceFcmToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) return false;

  const supported = await isSupported().catch(() => false);
  if (!supported) return false;

  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  try {
    const registration = (await ensureFcmServiceWorker()) ?? (await navigator.serviceWorker.ready);
    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return false;

    const idToken = await currentUser.getIdToken();
    const res = await fetch("/api/notifications/register-fcm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
    return res.ok;
  } catch (e) {
    console.warn("[FCM] registerDeviceFcmToken:", e);
    return false;
  }
}
