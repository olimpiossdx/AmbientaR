import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { addYearsIso } from "@/lib/platform-access";
import type { ConfirmPlatformPaymentInput } from "@/lib/billing/types";

const USERS = "users";
const PAYMENT_REQUESTS = "platform_payment_requests";
const BILLING_EVENTS = "platform_billing_events";

export async function markPlatformPaymentConfirmed(
  input: ConfirmPlatformPaymentInput,
): Promise<{ userId: string; platformAccessValidUntil: string }> {
  const db = adminDb();
  const extendYears = input.extendYears ?? 1;
  const validUntil = addYearsIso(extendYears);
  const now = FieldValue.serverTimestamp();

  const userRef = db.collection(USERS).doc(input.userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new Error(`Usuário não encontrado: ${input.userId}`);
  }

  await userRef.update({
    package: input.packageId,
    platformPaymentStatus: "paid",
    platformAccessValidUntil: validUntil,
    platformPaymentVerifiedAt: now,
    platformPaymentMethod: input.method ?? "pix",
    platformSubscriptionLapsedAt: FieldValue.delete(),
    packageUpdatedAt: now,
  });

  if (input.requestId) {
    await db.collection(PAYMENT_REQUESTS).doc(input.requestId).update({
      status: "confirmed",
      resolvedAt: now,
      resolvedBy: input.resolvedBy,
      sicoobStatus: "CONCLUIDA",
      webhookLastEvent: `confirmed:${input.txid}`,
    });
  } else {
    const pending = await db
      .collection(PAYMENT_REQUESTS)
      .where("userId", "==", input.userId)
      .where("txid", "==", input.txid)
      .limit(1)
      .get();
    if (!pending.empty) {
      await pending.docs[0]!.ref.update({
        status: "confirmed",
        resolvedAt: now,
        resolvedBy: input.resolvedBy,
        sicoobStatus: "CONCLUIDA",
        webhookLastEvent: `confirmed:${input.txid}`,
      });
    }
  }

  await db.collection(BILLING_EVENTS).doc(`confirm-${input.txid}`).set(
    {
      type: "payment_confirmed",
      userId: input.userId,
      packageId: input.packageId,
      txid: input.txid,
      resolvedBy: input.resolvedBy,
      platformAccessValidUntil: validUntil,
      at: now,
    },
    { merge: true },
  );

  return { userId: input.userId, platformAccessValidUntil: validUntil };
}

export async function markPlatformPaymentExpired(
  userId: string,
  reason: "cron" | "admin" | "webhook" = "cron",
): Promise<void> {
  const db = adminDb();
  const now = FieldValue.serverTimestamp();
  await db.collection(USERS).doc(userId).update({
    platformPaymentStatus: "expired",
    platformSubscriptionLapsedAt: now,
  });
  await db.collection(BILLING_EVENTS).doc(`expire-${userId}-${Date.now()}`).set({
    type: "subscription_expired",
    userId,
    reason,
    at: now,
  });
}

export async function rejectPlatformPaymentRequest(
  requestId: string,
  adminUid?: string,
): Promise<void> {
  const db = adminDb();
  const now = FieldValue.serverTimestamp();
  const ref = db.collection(PAYMENT_REQUESTS).doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Pedido de pagamento não encontrado.");

  await ref.update({
    status: "rejected",
    resolvedAt: now,
    resolvedBy: "admin",
    webhookLastEvent: adminUid ? `rejected_by:${adminUid}` : "rejected_by:admin",
  });
}

/** Idempotência de webhooks Sicoob. */
export async function wasBillingEventProcessed(eventKey: string): Promise<boolean> {
  const snap = await adminDb().collection(BILLING_EVENTS).doc(eventKey).get();
  return snap.exists;
}

export async function recordBillingWebhookEvent(
  eventKey: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await adminDb()
    .collection(BILLING_EVENTS)
    .doc(eventKey)
    .set(
      {
        type: "webhook_received",
        payload,
        at: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}
