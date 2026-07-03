import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import type { PipelineIngestMode } from "@/lib/mcp-rag/pipeline-client.server";
import { runPipelineIngestion } from "@/lib/mcp-rag/pipeline-ingest.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODES: PipelineIngestMode[] = [
  "discover",
  "incremental",
  "full",
  "reprocess",
];

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const body = (await request.json()) as {
      sourceId?: string;
      mode?: PipelineIngestMode;
      limit?: number;
    };

    const sourceId = body.sourceId || "almg-open-data";
    const mode = body.mode || "incremental";
    if (!MODES.includes(mode)) {
      return NextResponse.json(
        { error: `mode inválido. Use: ${MODES.join(", ")}` },
        { status: 400 },
      );
    }

    const result = await runPipelineIngestion({
      sourceId,
      mode,
      limit: body.limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
