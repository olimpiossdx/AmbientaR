import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { seedOfficialSourcesIfEmpty } from "@/lib/mcp-rag/store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const result = await seedOfficialSourcesIfEmpty();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
