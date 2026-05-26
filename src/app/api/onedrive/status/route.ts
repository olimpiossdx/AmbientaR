import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { getSyncSource } from "@/lib/onedrive/catalog-store";
import { assertOnedriveReady } from "@/lib/onedrive/api-guard";
import {
  isMicrosoftGraphConfigured,
  isOnedriveSyncEnabled,
} from "@/lib/onedrive/deploy-flags";
import { getGraphAccessToken } from "@/lib/onedrive/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);

    const enabled = isOnedriveSyncEnabled();
    const configured = isMicrosoftGraphConfigured();
    const source = enabled ? await getSyncSource() : null;

    let graphOk = false;
    let graphError: string | undefined;
    if (enabled && configured) {
      try {
        await getGraphAccessToken();
        graphOk = true;
      } catch (e) {
        graphError = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json({
      success: true,
      enabled,
      configured,
      graphOk,
      graphError,
      syncSource: source,
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const guard = assertOnedriveReady();
    if (!guard.ok) return guard.response;

    const { ensureProjectsSyncSource } = await import(
      "@/lib/onedrive/sync-delta"
    );
    const { source, created } = await ensureProjectsSyncSource();

    return NextResponse.json({
      success: true,
      created,
      syncSource: source,
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
