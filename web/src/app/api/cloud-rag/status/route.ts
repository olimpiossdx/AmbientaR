import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { assertCloudRagReady } from "@/lib/cloud-rag/api-guard";
import {
  isCloudRagEnabled,
  isCloudRagSearchEnabled,
} from "@/lib/cloud-rag/deploy-flags";
import { getLibraryRootPath } from "@/lib/cloud-rag/config";
import {
  countAllFiles,
  countChunks,
  countFilesByIndexStatus,
  getLibraryState,
} from "@/lib/cloud-rag/store";
import { isMicrosoftGraphConfigured } from "@/lib/onedrive/deploy-flags";
import { getDelegatedTokenDoc } from "@/lib/onedrive/consumer-oauth";
import {
  getGraphAccessTokenForMode,
  getGraphAuthMode,
} from "@/lib/onedrive/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);

    const enabled = isCloudRagEnabled();
    const searchEnabled = isCloudRagSearchEnabled();
    const configured = isMicrosoftGraphConfigured();
    const graphAuthMode = getGraphAuthMode();
    const delegatedDoc = await getDelegatedTokenDoc().catch(() => null);

    let graphOk = false;
    let graphError: string | undefined;
    if (enabled && configured) {
      try {
        await getGraphAccessTokenForMode(graphAuthMode);
        graphOk = true;
      } catch (e) {
        graphError = e instanceof Error ? e.message : String(e);
      }
    }

    const [fileCount, chunkCount, indexCounts, libraryState] = enabled
      ? await Promise.all([
          countAllFiles().catch(() => 0),
          countChunks().catch(() => 0),
          countFilesByIndexStatus().catch(() => ({})),
          getLibraryState().catch(() => null),
        ])
      : [0, 0, {}, null];

    return NextResponse.json({
      success: true,
      enabled,
      searchEnabled,
      configured,
      graphAuthMode,
      delegatedConnected: Boolean(delegatedDoc?.accessToken),
      graphOk,
      graphError,
      libraryRootPath: getLibraryRootPath(),
      libraryState,
      stats: {
        files: fileCount,
        chunks: chunkCount,
        indexStatus: indexCounts,
      },
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
