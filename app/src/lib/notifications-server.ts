import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import type { CreateNotificationPayload } from "@/lib/notifications";
import { NOTIFICATION_SOURCE } from "@/lib/notification-events";

export async function createNotificationForUserAdmin(
  userId: string,
  payload: CreateNotificationPayload,
): Promise<void> {
  const uid = userId?.trim();
  if (!uid) return;

  await adminDb()
    .collection("users")
    .doc(uid)
    .collection("notifications")
    .add({
      userId: uid,
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

export async function ensureUnreadNotificationAdmin(
  userId: string,
  payload: CreateNotificationPayload & { sourceType: string; sourceId: string },
): Promise<boolean> {
  const uid = userId?.trim();
  if (!uid) return false;

  const notificationsRef = adminDb()
    .collection("users")
    .doc(uid)
    .collection("notifications");

  const existing = await notificationsRef
    .where("sourceType", "==", payload.sourceType)
    .where("sourceId", "==", payload.sourceId)
    .get();

  const hasUnread = existing.docs.some((d) => d.data().isRead === false);
  if (hasUnread) return false;

  await createNotificationForUserAdmin(uid, payload);
  return true;
}

/** Valida que o caller pode notificar targetUserId para o evento de portal. */
export async function authorizePortalNotification(input: {
  callerUid: string;
  callerEmail?: string | null;
  targetUserId: string;
  sourceType: string;
  sourceId: string;
}): Promise<void> {
  const { callerUid, callerEmail, targetUserId, sourceType, sourceId } = input;
  if (!callerUid?.trim() || !targetUserId?.trim() || !sourceId?.trim()) {
    throw new Error("Parâmetros de notificação inválidos.");
  }

  const db = adminDb();
  const email = callerEmail?.trim().toLowerCase() ?? "";

  if (sourceType === NOTIFICATION_SOURCE.access_request_pending) {
    const snap = await db.collection("access_requests").doc(sourceId).get();
    if (!snap.exists) throw new Error("Pedido de acesso não encontrado.");
    const data = snap.data() as { requestedByUserId?: string; status?: string };
    if (data.requestedByUserId !== callerUid) {
      throw new Error("Não autorizado a notificar sobre este pedido.");
    }
    return;
  }

  if (sourceType === NOTIFICATION_SOURCE.access_request_resolved) {
    const snap = await db.collection("access_requests").doc(sourceId).get();
    if (!snap.exists) throw new Error("Pedido de acesso não encontrado.");
    const data = snap.data() as {
      requestedByUserId?: string;
      resolvedByUserId?: string;
    };
    if (data.resolvedByUserId !== callerUid) {
      throw new Error("Não autorizado a notificar sobre este pedido.");
    }
    if (data.requestedByUserId !== targetUserId) {
      throw new Error("Destinatário inválido para este pedido.");
    }
    return;
  }

  if (sourceType === NOTIFICATION_SOURCE.delegate_invite) {
    const snap = await db.collection("delegate_invites").doc(sourceId).get();
    if (!snap.exists) throw new Error("Convite não encontrado.");
    const data = snap.data() as {
      createdByUserId?: string;
      targetUserId?: string;
      targetEmail?: string;
    };

    const isTitular = data.createdByUserId === callerUid;
    const isProfessional =
      data.targetUserId === callerUid ||
      (email.length > 0 &&
        typeof data.targetEmail === "string" &&
        data.targetEmail.trim().toLowerCase() === email);

    if (!isTitular && !isProfessional) {
      throw new Error("Não autorizado a notificar sobre este convite.");
    }

    if (isTitular && data.targetUserId !== targetUserId) {
      throw new Error("Destinatário inválido para este convite.");
    }

    if (isProfessional && data.createdByUserId !== targetUserId) {
      throw new Error("Destinatário inválido para este convite.");
    }
    return;
  }

  throw new Error("Tipo de notificação não permitido.");
}
