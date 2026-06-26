import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import {
  isDocumentAvailable,
  parseLoginIdentifier,
} from "@/lib/auth/login-identities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`check-document:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as { document?: string };
    const document = body.document?.trim();
    if (!document) {
      return NextResponse.json({ error: "Informe o CPF ou CNPJ." }, { status: 400 });
    }

    const parsed = parseLoginIdentifier(document);
    if (parsed.kind !== "document" || !parsed.documentDigits) {
      return NextResponse.json(
        { error: "Informe um CPF ou CNPJ válido." },
        { status: 400 },
      );
    }

    const available = await isDocumentAvailable(adminDb(), parsed.documentDigits);
    return NextResponse.json({ success: true, available });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
