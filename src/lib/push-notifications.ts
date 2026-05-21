"use client";

import type { Notification } from "@/lib/types";

const DEFAULT_ICON = "/icons/icon-192x192.png";

export function canUseBrowserNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | null> {
  if (!canUseBrowserNotifications()) return null;
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return null;
  }
}

export async function showBrowserNotificationForAppAlert(
  item: Pick<Notification, "title" | "description" | "link" | "sourceType" | "sourceId">,
): Promise<void> {
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") return;

  const tag =
    item.sourceType && item.sourceId
      ? `${item.sourceType}:${item.sourceId}`
      : `alert:${item.title}`;

  const options: NotificationOptions = {
    body: item.description,
    icon: DEFAULT_ICON,
    badge: DEFAULT_ICON,
    tag,
    data: { link: item.link || "/" },
    requireInteraction: false,
  };

  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration?.showNotification) {
      await registration.showNotification(item.title, options);
      return;
    }
  } catch {
    /* fallback abaixo */
  }

  try {
    const n = new window.Notification(item.title, options);
    n.onclick = () => {
      window.focus();
      const link = item.link || "/";
      if (window.location.pathname !== link) {
        window.location.href = link;
      }
      n.close();
    };
  } catch {
    /* permissão revogada ou contexto inválido */
  }
}
