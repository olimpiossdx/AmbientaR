import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import {
  parseLoginIdentifier,
  registerLoginIdentity,
} from "@/lib/auth/login-identities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedApi(request);
    const body = (await request.json()) as { document?: string };
    const document = body.document?.trim();
    if (!document) {
      return NextResponse.json({ error: "Informe o CPF ou CNPJ." }, { status: 400 });
    }

    const parsed = parseLoginIdentifier(document);
    if (parsed.kind !== "document" || !parsed.documentDigits || !parsed.documentType) {
      return NextResponse.json(
        { error: "Informe um CPF ou CNPJ válido." },
        { status: 400 },
      );
    }

    await registerLoginIdentity(adminDb(), {
      uid: user.uid,
      email: user.email,
      documentDigits: parsed.documentDigits,
      documentType: parsed.documentType,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("já está vinculado")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return apiAuthErrorResponse(err);
  }
}
