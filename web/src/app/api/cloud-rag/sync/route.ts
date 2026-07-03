import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { assertCloudRagReady } from "@/lib/cloud-rag/api-guard";
import { syncLibrary } from "@/lib/cloud-rag/graph-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const guard = assertCloudRagReady();
    if (!guard.ok) return guard.response;

    const body = (await request.json().catch(() => ({}))) as {
      jobId?: string;
      continueDelta?: boolean;
      maxPages?: number;
    };

    const result = await syncLibrary({
      jobId: body.jobId?.trim(),
      continueDelta: body.continueDelta === true,
      maxPages: body.maxPages,
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: result.completed
        ? "Sincronização da biblioteca concluída."
        : "Lote de sync processado; chame novamente com jobId para continuar.",
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
