import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  getBearerToken,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { getSicoobPixConfig } from "@/lib/sicoob-pix/config";
import { findPaymentRequestByTxid } from "@/lib/billing/create-charge";
import { processSicoobPixWebhook } from "@/lib/billing/process-webhook";

/** Confirma cobrança em modo mock (homologação local). */
export async function POST(req: Request) {
  try {
    const config = getSicoobPixConfig();
    if (!config.mockMode) {
      return NextResponse.json(
        { ok: false, error: "Disponível apenas com SICOOB_MOCK_MODE=true." },
        { status: 403 },
      );
    }

    const user = await requireAuthenticatedApi(req);
    const body = (await req.json()) as { txid?: string };
    const txid = body.txid?.trim();
    if (!txid) {
      return NextResponse.json({ ok: false, error: "txid obrigatório." }, { status: 400 });
    }

    const request = await findPaymentRequestByTxid(txid);
    if (!request || request.data.userId !== (user.uid || user.id)) {
      return NextResponse.json({ ok: false, error: "Cobrança não encontrada." }, { status: 404 });
    }

    const result = await processSicoobPixWebhook(
      {
        pix: [
          {
            txid,
            valor: String(request.data.amountBrl),
            horario: new Date().toISOString(),
            endToEndId: `MOCK_${Date.now()}`,
          },
        ],
      },
      `mock-confirm-${txid}-${Date.now()}`,
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (!getBearerToken(req)) return apiAuthErrorResponse(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Falha na simulação." },
      { status: 500 },
    );
  }
}
