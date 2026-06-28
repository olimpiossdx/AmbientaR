// src/services/pushNotification.ts

const VAPID_PUBLIC_KEY = "SUA_CHAVE_PUBLICA_DA_API";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer as ArrayBuffer;
}

export async function subscribeToPush(): Promise<PushSubscription> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker não suportado.");
  }

  if (!("PushManager" in window)) {
    throw new Error("Push API não suportada.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Permissão de notificação negada.");
  }

  const registration = await navigator.serviceWorker.register("/service-worker.js");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  return subscription;
}