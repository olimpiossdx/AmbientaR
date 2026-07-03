import { NextResponse } from "next/server";
import { attachSignedUrls, getMosaic } from "@/lib/fiscal-ambiental/mosaic-service";
import { requireFadWorkspaceAccess } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../../_fad-api-guard";

type RouteContext = { params: Promise<{ mosaicId: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { mosaicId } = await context.params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_QUERY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceAccess(workspaceId, user.uid, user.role === "admin");

    const mosaic = await getMosaic(workspaceId, mosaicId);
    if (!mosaic || mosaic.status !== "ready") {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Imagem não encontrada." } },
        { status: 404 },
      );
    }

    const withUrls = await attachSignedUrls(mosaic);
    if (!withUrls.geotiffUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "NO_GEOTIFF",
            message: "GeoTIFF não disponível para esta cena (worker GDAL ou asset COG em falta).",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: { downloadUrl: withUrls.geotiffUrl, mosaic: withUrls },
    });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      const status = (err as Error & { status: number }).status;
      return NextResponse.json(
        { ok: false, error: { code: "ERROR", message: err.message } },
        { status },
      );
    }
    return handleFadApiError(err);
  }
}
