import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { markPlatformPaymentExpired } from "@/lib/billing/sync-platform-access";

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim() || process.env.BILLING_CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header =
    req.headers.get("x-cron-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === secret;
}

/** Marca assinaturas pagas com validUntil no passado como expired. */
export async function POST(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const now = Date.now();
  const snap = await adminDb()
    .collection("users")
    .where("platformPaymentStatus", "==", "paid")
    .get();

  const expired: string[] = [];
  for (const doc of snap.docs) {
    const until = doc.data().platformAccessValidUntil as string | undefined;
    if (!until) continue;
    if (new Date(until).getTime() < now) {
      await markPlatformPaymentExpired(doc.id, "cron");
      expired.push(doc.id);
    }
  }

  await adminDb().collection("platform_billing_events").doc(`cron-lapse-${Date.now()}`).set({
    type: "cron_lapse_run",
    expiredCount: expired.length,
    expiredUserIds: expired,
    at: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, expiredCount: expired.length, expiredUserIds: expired });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "subscription-lapse-cron",
    usage: "POST com header x-cron-secret ou Authorization Bearer CRON_SECRET",
  });
}
