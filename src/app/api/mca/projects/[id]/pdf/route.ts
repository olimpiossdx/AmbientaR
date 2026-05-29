import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { buildMcaLayoutPdf } from "@/lib/mca/layout-pdf";
import { loadMcaPdfBuildOptions } from "@/lib/mca/pdf-build-options";
import { resolveMcaPdfMapImage } from "@/lib/mca/resolve-pdf-map-image-server";
import { listProjectReviews, reviewsReadyForExport } from "@/lib/mca/review/review-queue";

export const maxDuration = 60;

type PdfBody = { mapImageDataUrl?: string; preview?: boolean; includeSatellite?: boolean };

async function buildPdfResponse(
  projectId: string,
  uid: string,
  body?: PdfBody,
  preview = false,
  includeSatelliteQuery = false,
) {
  const project = await loadMcaProject(projectId, uid);
  if (!project) {
    return NextResponse.json({ success: false, error: "Não encontrado." }, { status: 404 });
  }
  const reviews = await listProjectReviews(projectId, uid);
  const exportReady = reviewsReadyForExport(reviews);
  if (!preview && reviews.length > 0 && !exportReady) {
    return NextResponse.json(
      {
        success: false,
        error: "Revisão humana pendente em camadas críticas. Aprove na aba Revisão ou use preview=1.",
        reviewsPending: reviews.filter((r) => r.status === "pending").length,
      },
      { status: 428 },
    );
  }
  const pdfOptions = await loadMcaPdfBuildOptions(projectId);
  const mapImage =
    typeof body?.mapImageDataUrl === "string" && body.mapImageDataUrl.startsWith("data:image")
      ? body.mapImageDataUrl
      : null;
  const includeSatellite = Boolean(body?.includeSatellite ?? includeSatelliteQuery);
  const mapResolved = await resolveMcaPdfMapImage({
    project,
    layers: pdfOptions.layers ?? {},
    clientMapImageDataUrl: mapImage,
    includeSatellite,
  });
  const buf = buildMcaLayoutPdf(project, {
    ...pdfOptions,
    mapImageDataUrl: mapResolved.mapImageDataUrl,
  });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mca-${projectId}.pdf"`,
      "X-MCA-Export-Ready": exportReady ? "true" : "false",
      "X-MCA-Map-Mode": mapResolved.mode,
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const preview = req.nextUrl.searchParams.get("preview") === "1";
    const satellite = req.nextUrl.searchParams.get("satellite") === "1";
    return await buildPdfResponse(params.id, user.uid, undefined, preview, satellite);
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "PDF falhou" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json().catch(() => ({}))) as PdfBody;
    return await buildPdfResponse(params.id, user.uid, body, body?.preview === true);
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "PDF falhou" },
      { status: 500 },
    );
  }
}
