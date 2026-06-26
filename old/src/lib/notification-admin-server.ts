import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { sendPushToPortalUsers } from "@/lib/notification-push-server";

export type AdminNotificationPayload = {
  title: string;
  description: string;
  link?: string;
  sourceType?: string;
  sourceId?: string;
  actorRole?: string;
};

/** Cria notificação in-app via Admin SDK (APIs server-side). */
export async function createNotificationForUserAdmin(
  db: Firestore,
  userId: string,
  payload: AdminNotificationPayload,
): Promise<void> {
  if (!userId?.trim()) return;
  await db.collection("users").doc(userId).collection("notifications").add({
    userId,
    title: payload.title,
    description: payload.description,
    link: payload.link ?? null,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
    sourceType: payload.sourceType ?? null,
    sourceId: payload.sourceId ?? null,
    actorRole: payload.actorRole ?? null,
  });
}

export async function notifyUserWithPushAdmin(
  db: Firestore,
  userId: string,
  payload: AdminNotificationPayload,
): Promise<void> {
  await createNotificationForUserAdmin(db, userId, payload);
  void sendPushToPortalUsers([userId], {
    title: payload.title,
    body: payload.description,
    link: payload.link,
    sourceType: payload.sourceType,
    sourceId: payload.sourceId,
  });
}
