import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { assertCloudRagReady } from "@/lib/cloud-rag/api-guard";
import { isCloudRagSearchEnabled } from "@/lib/cloud-rag/deploy-flags";
import {
  formatCloudRagHitsForPrompt,
  searchCloudRag,
} from "@/lib/cloud-rag/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const guard = assertCloudRagReady();
    if (!guard.ok) return guard.response;

    if (!isCloudRagSearchEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: "Pesquisa na biblioteca nuvem desativada (ONEDRIVE_RAG_SEARCH_ENABLED).",
        },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      query?: string;
      pathPrefix?: string;
      cpfCnpj?: string;
      extensions?: string[];
      maxChunks?: number;
      modifiedAfter?: string;
    };

    const { chunks, citations } = await searchCloudRag({
      query: body.query,
      pathPrefix: body.pathPrefix,
      cpfCnpj: body.cpfCnpj,
      extensions: body.extensions,
      maxChunks: body.maxChunks,
      modifiedAfter: body.modifiedAfter,
    });

    return NextResponse.json({
      success: true,
      chunks,
      citations,
      contextText: formatCloudRagHitsForPrompt(chunks),
      count: chunks.length,
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
