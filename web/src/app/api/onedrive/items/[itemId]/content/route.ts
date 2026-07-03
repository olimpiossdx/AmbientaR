import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { getSyncSource } from "@/lib/onedrive/catalog-store";
import { assertOnedriveReady } from "@/lib/onedrive/api-guard";
import { getGraphAccessToken } from "@/lib/onedrive/graph";
import { DEFAULT_PROJECTS_SYNC_SOURCE_ID } from "@/lib/onedrive/catalog-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { itemId: string } };

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireAdminApiAuth(request);
    const guard = assertOnedriveReady();
    if (!guard.ok) return guard.response;

    const itemId = context.params.itemId;
    const clientId = request.nextUrl.searchParams.get("clientId")?.trim();
    if (!itemId || !clientId) {
      return NextResponse.json(
        { success: false, error: "itemId e clientId são obrigatórios." },
        { status: 400 },
      );
    }

    const source =
      (await getSyncSource()) ||
      (await getSyncSource(DEFAULT_PROJECTS_SYNC_SOURCE_ID));
    if (!source?.driveId) {
      return NextResponse.json(
        { success: false, error: "Drive não configurado." },
        { status: 503 },
      );
    }

    const token = await getGraphAccessToken();
    const contentUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(source.driveId)}/items/${encodeURIComponent(itemId)}/content`;

    const graphRes = await fetch(contentUrl, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: "manual",
    });

    if (graphRes.status >= 300 && graphRes.status < 400) {
      const location = graphRes.headers.get("location");
      if (location) {
        return NextResponse.redirect(location, 302);
      }
    }

    if (!graphRes.ok) {
      const text = await graphRes.text();
      return NextResponse.json(
        {
          success: false,
          error: `Falha ao obter ficheiro: ${graphRes.status}`,
          detail: text.slice(0, 300),
        },
        { status: graphRes.status },
      );
    }

    const blob = await graphRes.arrayBuffer();
    const contentType =
      graphRes.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
