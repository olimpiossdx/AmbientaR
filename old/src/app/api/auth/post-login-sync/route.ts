import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { syncEmpreendedorLinkForUser } from "@/lib/auth/empreendedor-link.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedApi(request);
    const updated = await syncEmpreendedorLinkForUser(adminDb(), user);
    return NextResponse.json({
      success: true,
      linkedEmpreendedorId: updated.linkedEmpreendedorId ?? null,
      linkedClientId: updated.linkedClientId ?? null,
    });
  } catch (err) {
    return apiAuthErrorResponse(err);
  }
}
