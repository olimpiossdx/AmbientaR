import { getMessaging } from "firebase-admin/messaging";
import { adminDb } from "@/lib/firebase-admin";

export type PushPayload = {
  title: string;
  body: string;
  link?: string;
  sourceType?: string;
  sourceId?: string;
};

/**
 * Envia push FCM (Android/iOS PWA) para tokens guardados em `users/{uid}.fcmTokens`.
 * Ignora falhas individuais; requer VAPID/FCM configurado no projeto Firebase.
 */
export async function sendPushToPortalUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return { sent: 0, failed: 0 };

  const db = adminDb();
  const tokens = new Set<string>();

  for (const uid of uniqueIds) {
    const snap = await db.collection("users").doc(uid).get();
    const list = snap.data()?.fcmTokens;
    if (Array.isArray(list)) {
      for (const t of list) {
        if (typeof t === "string" && t.trim()) tokens.add(t.trim());
      }
    }
  }

  const tokenList = [...tokens];
  if (tokenList.length === 0) return { sent: 0, failed: 0 };

  try {
    const messaging = getMessaging();
    const res = await messaging.sendEachForMulticast({
      tokens: tokenList,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        link: payload.link || "/",
        title: payload.title,
        body: payload.body,
        ...(payload.sourceType ? { sourceType: payload.sourceType } : {}),
        ...(payload.sourceId ? { sourceId: payload.sourceId } : {}),
      },
      webpush: {
        fcmOptions: {
          link: payload.link || "/",
        },
      },
    });
    return { sent: res.successCount, failed: res.failureCount };
  } catch (e) {
    console.warn("[FCM] sendPushToPortalUsers:", e);
    return { sent: 0, failed: tokenList.length };
  }
}
