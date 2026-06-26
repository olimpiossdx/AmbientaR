import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  getBearerToken,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { isClientePortalRole } from "@/lib/role-guards";
import { createPlatformPaymentCharge } from "@/lib/billing/create-charge";
import type { ClientPackage } from "@/lib/types";
import { clientPackageRequiresAnnualPaymentStep } from "@/lib/platform-access";

export async function POST(req: Request) {
  try {
    const user = await requireAuthenticatedApi(req);
    if (!isClientePortalRole(user.role)) {
      return NextResponse.json(
        { ok: false, error: "Cobrança disponível apenas para titulares do portal." },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { packageId?: ClientPackage };
    const packageId = body.packageId ?? user.package;
    if (!packageId || !clientPackageRequiresAnnualPaymentStep(packageId)) {
      return NextResponse.json(
        { ok: false, error: "Plano inválido ou sem cobrança anual." },
        { status: 400 },
      );
    }

    const { requestId, charge } = await createPlatformPaymentCharge({
      user,
      packageId,
    });

    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        txid: charge.txid,
        amountBrl: charge.amountBrl,
        pixCopiaECola: charge.pixCopiaECola,
        qrCodeBase64: charge.qrCodeBase64 ?? null,
        expiresAt: charge.expiresAt,
        status: charge.status,
        mock: charge.mock,
        platformPaymentStatus: "pending_verification",
      },
    });
  } catch (error) {
    if (!getBearerToken(req)) return apiAuthErrorResponse(error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao criar cobrança.",
      },
      { status: 500 },
    );
  }
}
