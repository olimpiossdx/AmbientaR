import { NextResponse } from "next/server";
import { getSicoobPixConfig } from "@/lib/sicoob-pix/config";
import {
  parseSicoobWebhookBody,
  validateSicoobWebhookToken,
} from "@/lib/sicoob-pix/webhook";
import { processSicoobPixWebhook } from "@/lib/billing/process-webhook";

async function handleWebhook(req: Request) {
  const config = getSicoobPixConfig();
  const token =
    req.headers.get("x-sicoob-webhook-token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;

  if (!validateSicoobWebhookToken(token, config.webhookAccessToken)) {
    return NextResponse.json({ ok: false, error: "Webhook não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const result = await processSicoobPixWebhook(body);
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  try {
    return await handleWebhook(req);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro no webhook." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "sicoob-pix-webhook",
    note: "Sicoob envia POST; sufixo /pix pode ser adicionado pelo banco.",
  });
}
