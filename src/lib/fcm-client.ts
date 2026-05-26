"use client";

import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const FCM_SW_SCRIPT = "/firebase-messaging-sw.js";
const FCM_SW_SCOPE = "/";

let fcmRegisterAttempted = false;

function isFcmMisconfiguredError(err: unknown): boolean {
  const code = (err as { code?: string })?.code ?? "";
  const message = (err as Error)?.message ?? String(err);
  return (
    code === "messaging/token-subscribe-failed" ||
    code === "messaging/permission-blocked" ||
    /authentication credential/i.test(message) ||
    /token-subscribe-failed/i.test(message)
  );
}

async function ensureFcmServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const existing =
    (await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE)) ??
    (await navigator.serviceWorker.getRegistration());
  if (existing?.active) return existing;
  try {
    return await navigator.serviceWorker.register(FCM_SW_SCRIPT, {
      scope: FCM_SW_SCOPE,
    });
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[FCM] service worker:", e);
    }
    return null;
  }
}

/**
 * Regista token FCM do dispositivo (PWA/celular) no perfil do utilizador.
 * Requer `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (Firebase Console → Cloud Messaging → Web Push).
 * Falha em silêncio se o projeto não tiver FCM/Web Push configurado (evita ruído na consola).
 */
export async function registerDeviceFcmToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (fcmRegisterAttempted) return false;
  fcmRegisterAttempted = true;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) return false;

  const supported = await isSupported().catch(() => false);
  if (!supported) return false;

  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  try {
    const registration =
      (await ensureFcmServiceWorker()) ?? (await navigator.serviceWorker.ready);
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
    if (isFcmMisconfiguredError(e)) {
      if (process.env.NODE_ENV === "development") {
        console.info(
          "[FCM] Push não configurado ou VAPID inválido — defina NEXT_PUBLIC_FIREBASE_VAPID_KEY no Firebase Console (Cloud Messaging → Web Push).",
        );
      }
      return false;
    }
    if (process.env.NODE_ENV === "development") {
      console.warn("[FCM] registerDeviceFcmToken:", e);
    }
    return false;
  }
}

/** Permite nova tentativa após login (ex.: utilizador concedeu permissão depois). */
export function resetFcmRegistrationAttempt(): void {
  fcmRegisterAttempted = false;
}
