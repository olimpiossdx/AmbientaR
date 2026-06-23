import { NextResponse } from "next/server";
import { getSicoobPixConfig } from "@/lib/sicoob-pix/config";
import { validateSicoobWebhookToken } from "@/lib/sicoob-pix/webhook";
import { processSicoobPixWebhook } from "@/lib/billing/process-webhook";

/** Sicoob adiciona sufixo /pix à URL registrada no portal. */
export async function POST(req: Request) {
  const config = getSicoobPixConfig();
  const token =
    req.headers.get("x-sicoob-webhook-token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;

  if (!validateSicoobWebhookToken(token, config.webhookAccessToken)) {
    return NextResponse.json({ ok: false, error: "Webhook não autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await processSicoobPixWebhook(body);
    return NextResponse.json({ ok: true, path: "sicoob/pix", ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro no webhook /pix." },
      { status: 500 },
    );
  }
}
