import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { buildMcpRagHubOverview } from "@/lib/mcp-rag/hub-overview.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const overview = await buildMcpRagHubOverview();
    return NextResponse.json({ success: true, overview });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
