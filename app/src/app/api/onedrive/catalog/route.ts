import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import {
  getActiveFolderLinkByClientId,
  listCatalogForClient,
} from "@/lib/onedrive/catalog-store";
import { assertOnedriveReady } from "@/lib/onedrive/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const guard = assertOnedriveReady();
    if (!guard.ok) return guard.response;

    const clientId = request.nextUrl.searchParams.get("clientId")?.trim();
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Informe clientId na query." },
        { status: 400 },
      );
    }

    const link = await getActiveFolderLinkByClientId(clientId);
    const entries = await listCatalogForClient(clientId, { limit: 1000 });

    return NextResponse.json({
      success: true,
      link,
      entries,
      count: entries.length,
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
