import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { buildLayoutJson } from "@/lib/mca/layout/build-layout-json";
import { buildMcaLayoutPdf } from "@/lib/mca/layout-pdf";
import { loadMcaPdfBuildOptions } from "@/lib/mca/pdf-build-options";
import { renderLayoutPdfViaWorker, isQgisWorkerConfigured } from "@/lib/mca/export/qgis-worker-client";
import { listProjectReviews, reviewsReadyForExport } from "@/lib/mca/review/review-queue";
import { resolveTileMode } from "@/lib/mca/tiles/tile-policy";
import { resolveMcaPdfMapImage } from "@/lib/mca/resolve-pdf-map-image-server";
import { isPostGisConfigured } from "@/lib/mca/spatial/postgis-config";

export const maxDuration = 120;

type ExportFinalBody = { mapImageDataUrl?: string; includeSatellite?: boolean };

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const project = await loadMcaProject(params.id, user.uid);
    if (!project) {
      return NextResponse.json({ success: false, error: "Não encontrado." }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      qgisWorker: isQgisWorkerConfigured(),
      postgis: isPostGisConfigured(),
      tileMode: resolveTileMode(project.meta.areaTotalHa),
      exportReady: reviewsReadyForExport(await listProjectReviews(params.id, user.uid)),
      releaseEtapa: (project.currentEtapa ?? 0) >= 15,
      scores: project.scores,
      fallbackPdfAvailable: true,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 400 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json().catch(() => ({}))) as ExportFinalBody;
    const includeSatelliteQuery = req.nextUrl.searchParams.get("satellite") === "1";
    const project = await loadMcaProject(params.id, user.uid);
    if (!project) {
      return NextResponse.json({ success: false, error: "Não encontrado." }, { status: 404 });
    }

    const reviews = await listProjectReviews(params.id, user.uid);
    if (reviews.length > 0 && !reviewsReadyForExport(reviews)) {
      return NextResponse.json(
        {
          success: false,
          error: "Revisão humana pendente. Aprove na aba Revisão antes do PDF final.",
        },
        { status: 428 },
      );
    }

    const pdfOptions = await loadMcaPdfBuildOptions(params.id);
    const layers = pdfOptions.layers ?? {};
    const layoutJson =
      project.layoutJson ?? buildLayoutJson(project, new Map(Object.entries(layers)));

    const clientMap =
      typeof body.mapImageDataUrl === "string" && body.mapImageDataUrl.startsWith("data:image")
        ? body.mapImageDataUrl
        : null;
    const mapResolved = await resolveMcaPdfMapImage({
      project,
      layers,
      clientMapImageDataUrl: clientMap,
      includeSatellite: Boolean(body.includeSatellite ?? includeSatelliteQuery),
    });
    const mapImageDataUrl = mapResolved.mapImageDataUrl;

    const preferFallback =
      req.nextUrl.searchParams.get("fallback") === "1" ||
      req.nextUrl.searchParams.get("fallback") === "jspdf";

    if (!isQgisWorkerConfigured() || preferFallback) {
      const pdf = await buildMcaLayoutPdf(project, {
        ...pdfOptions,
        mapImageDataUrl,
      });
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="mca-${params.id}-release.pdf"`,
          "X-MCA-Renderer": "jspdf-e13-fallback",
          "X-MCA-Tile-Mode": resolveTileMode(project.meta.areaTotalHa),
          "X-MCA-Map-Mode": mapResolved.mode,
        },
      });
    }

    try {
      const pdf = await renderLayoutPdfViaWorker({
        layoutJson,
        layers,
        projectId: params.id,
        mapImageDataUrl,
      });

      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="mca-${params.id}-final.pdf"`,
          "X-MCA-Renderer": "qgis-worker",
          "X-MCA-Tile-Mode": resolveTileMode(project.meta.areaTotalHa),
          "X-MCA-Map-Mode": mapResolved.mode,
        },
      });
    } catch (workerErr) {
      const pdf = await buildMcaLayoutPdf(project, {
        ...pdfOptions,
        mapImageDataUrl,
      });
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="mca-${params.id}-release.pdf"`,
          "X-MCA-Renderer": "jspdf-e13-fallback",
          "X-MCA-Worker-Error": workerErr instanceof Error ? workerErr.message : "worker-fail",
          "X-MCA-Tile-Mode": resolveTileMode(project.meta.areaTotalHa),
          "X-MCA-Map-Mode": mapResolved.mode,
        },
      });
    }
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Export final falhou" },
      { status: 500 },
    );
  }
}
