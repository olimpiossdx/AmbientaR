import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { buildPlatformPaymentTxid } from "@/lib/billing/txid";
import { resolvePackageAnnualAmountBrl } from "@/lib/billing/pricing";
import { createSicoobImmediateCharge } from "@/lib/sicoob-pix/cob";
import { getSicoobPixConfig } from "@/lib/sicoob-pix/config";
import type { PlatformPaymentRequestRecord } from "@/lib/billing/types";
import type { AppUser, ClientPackage } from "@/lib/types";
import { getPackageAnnualAmountLabel } from "@/lib/package-pricing";

const PAYMENT_REQUESTS = "platform_payment_requests";

export async function createPlatformPaymentCharge(input: {
  user: Pick<AppUser, "id" | "uid" | "email" | "name" | "package">;
  packageId: ClientPackage;
}): Promise<{
  requestId: string;
  charge: Awaited<ReturnType<typeof createSicoobImmediateCharge>>;
}> {
  const userId = input.user.uid || input.user.id;
  const amountBrl = resolvePackageAnnualAmountBrl(input.packageId);
  if (amountBrl == null) {
    throw new Error("Plano selecionado não exige pagamento anual.");
  }

  const txid = buildPlatformPaymentTxid(userId);
  const config = getSicoobPixConfig();
  const charge = await createSicoobImmediateCharge({
    txid,
    amountBrl,
    packageId: input.packageId,
    payerLabel: input.user.name,
  });

  const record: PlatformPaymentRequestRecord = {
    userId,
    email: input.user.email,
    name: input.user.name,
    packageId: input.packageId,
    method: "pix",
    amountLabel: getPackageAnnualAmountLabel(input.packageId),
    amountBrl,
    status: "pending_verification",
    provider: charge.mock ? "mock" : "sicoob",
    txid,
    qrExpiresAt: charge.expiresAt,
    pixCopiaECola: charge.pixCopiaECola,
    sicoobStatus: charge.status,
    createdAt: FieldValue.serverTimestamp(),
  };

  const ref = await adminDb().collection(PAYMENT_REQUESTS).add(record);

  await adminDb().collection("users").doc(userId).update({
    package: input.packageId,
    platformPaymentStatus: "pending_verification",
    platformAccessValidUntil: null,
    platformPaymentMethod: "pix",
    packageUpdatedAt: FieldValue.serverTimestamp(),
  });

  return { requestId: ref.id, charge };
}

export async function findPaymentRequestByTxid(txid: string) {
  const snap = await adminDb()
    .collection(PAYMENT_REQUESTS)
    .where("txid", "==", txid)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { id: doc.id, data: doc.data() as PlatformPaymentRequestRecord };
}
