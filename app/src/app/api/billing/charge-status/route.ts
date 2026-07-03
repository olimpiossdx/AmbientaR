import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  getBearerToken,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { findPaymentRequestByTxid } from "@/lib/billing/create-charge";
import { getSicoobChargeStatus, isSicoobChargePaidStatus } from "@/lib/sicoob-pix/cob";
import { markPlatformPaymentConfirmed } from "@/lib/billing/sync-platform-access";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const user = await requireAuthenticatedApi(req);
    const { searchParams } = new URL(req.url);
    const txid = searchParams.get("txid")?.trim();
    if (!txid) {
      return NextResponse.json({ ok: false, error: "Parâmetro txid obrigatório." }, { status: 400 });
    }

    const request = await findPaymentRequestByTxid(txid);
    if (!request || request.data.userId !== (user.uid || user.id)) {
      return NextResponse.json({ ok: false, error: "Cobrança não encontrada." }, { status: 404 });
    }

    let status = request.data.sicoobStatus ?? "pending_verification";
    let paid = request.data.status === "confirmed";

    if (!paid) {
      try {
        const remote = await getSicoobChargeStatus(txid);
        status = remote.status;
        if (isSicoobChargePaidStatus(remote.status)) {
          await markPlatformPaymentConfirmed({
            userId: request.data.userId,
            packageId: request.data.packageId,
            txid,
            requestId: request.id,
            method: "pix",
            resolvedBy: "webhook",
          });
          paid = true;
        }
      } catch {
        // mantém status local se consulta remota falhar
      }
    }

    const userSnap = await adminDb().collection("users").doc(user.uid || user.id).get();
    const platformPaymentStatus = userSnap.data()?.platformPaymentStatus;

    return NextResponse.json({
      ok: true,
      data: {
        txid,
        requestStatus: paid ? "confirmed" : request.data.status,
        sicoobStatus: status,
        paid,
        platformPaymentStatus,
        platformAccessValidUntil: userSnap.data()?.platformAccessValidUntil ?? null,
      },
    });
  } catch (error) {
    if (!getBearerToken(req)) return apiAuthErrorResponse(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Falha na consulta." },
      { status: 500 },
    );
  }
}
