import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { assertCloudRagReady } from "@/lib/cloud-rag/api-guard";
import { indexPendingFiles } from "@/lib/cloud-rag/indexer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const guard = assertCloudRagReady();
    if (!guard.ok) return guard.response;

    const body = (await request.json().catch(() => ({}))) as {
      jobId?: string;
      limit?: number;
    };

    const result = await indexPendingFiles({
      jobId: body.jobId?.trim(),
      limit: body.limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: `Indexação: ${result.indexed} ok, ${result.failed} falha(s), ${result.skipped} ignorado(s).`,
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
