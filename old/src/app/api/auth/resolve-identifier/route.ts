import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import {
  parseLoginIdentifier,
  resolveLoginEmail,
} from "@/lib/auth/login-identities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVALID_MSG = "E-mail/documento ou senha incorretos.";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`resolve-identifier:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: INVALID_MSG }, { status: 429 });
  }

  try {
    const body = (await request.json()) as { identifier?: string };
    const identifier = body.identifier?.trim();
    if (!identifier) {
      return NextResponse.json({ error: INVALID_MSG }, { status: 400 });
    }

    parseLoginIdentifier(identifier);
    const email = await resolveLoginEmail(adminDb(), identifier);

    return NextResponse.json({ success: true, email });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "INVALID_CREDENTIALS") {
      return NextResponse.json({ error: INVALID_MSG }, { status: 404 });
    }
    return NextResponse.json(
      { error: message.includes("válido") ? message : INVALID_MSG },
      { status: 400 },
    );
  }
}
