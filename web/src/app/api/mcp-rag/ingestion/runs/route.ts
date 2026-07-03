import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { listRecentIngestionRuns } from "@/lib/mcp-rag/store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const limit = Number(request.nextUrl.searchParams.get("limit") || "30");
    const runs = await listRecentIngestionRuns(
      Number.isFinite(limit) ? Math.min(limit, 100) : 30,
    );
    return NextResponse.json({ success: true, runs });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
