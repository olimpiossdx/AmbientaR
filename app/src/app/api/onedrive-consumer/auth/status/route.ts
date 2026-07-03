import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { getDelegatedTokenDoc } from "@/lib/onedrive/consumer-oauth";
import { getGraphAuthMode } from "@/lib/onedrive/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const authMode = getGraphAuthMode();
    const doc = await getDelegatedTokenDoc();

    return NextResponse.json({
      success: true,
      authMode,
      connected: Boolean(doc?.accessToken),
      uid: doc?.uid || null,
      updatedAt: doc?.updatedAt || null,
      expiresAtMs: doc?.expiresAtMs || null,
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
