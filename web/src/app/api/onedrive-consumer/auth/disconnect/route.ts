import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { disconnectDelegatedToken } from "@/lib/onedrive/consumer-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    await disconnectDelegatedToken();
    return NextResponse.json({ success: true });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
