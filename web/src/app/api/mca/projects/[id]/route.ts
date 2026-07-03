import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import { mcaLayerFeatureCount } from "@/lib/mca/layer-feature-count";
import type { McaProjectDoc, McaProjectMeta } from "@/lib/mca/types";

const COL = "mca_projects";

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
    const layersMode = req.nextUrl.searchParams.get("layers") ?? "manifest";
    const layersSnap = await studyMapsAdminDb()
      .collection(COL)
      .doc(params.id)
      .collection("layers")
      .get();

    if (layersMode === "none") {
      return NextResponse.json({ success: true, project, layers: {}, layerManifest: [] });
    }

    if (layersMode === "full") {
      const layers: Record<string, unknown> = {};
      layersSnap.docs.forEach((d: { id: string; data: () => Record<string, unknown> }) => {
        layers[d.id] = d.data().geojson ?? null;
      });
      return NextResponse.json({ success: true, project, layers });
    }

    const layerManifest: { id: string; featureCount: number }[] = [];
    layersSnap.docs.forEach((d: { id: string; data: () => Record<string, unknown> }) => {
      const geojson = d.data().geojson;
      layerManifest.push({
        id: d.id,
        featureCount: mcaLayerFeatureCount(geojson),
      });
    });
    return NextResponse.json({
      success: true,
      project,
      layers: {},
      layerManifest,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 401 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const project = await loadMcaProject(params.id, user.uid);
    if (!project) {
      return NextResponse.json({ success: false, error: "Não encontrado." }, { status: 404 });
    }
    const body = (await req.json()) as Partial<{
      title: string;
      meta: McaProjectMeta;
      perimeterGeoJson: McaProjectDoc["perimeterGeoJson"];
      currentEtapa: number;
      etapaStatus: McaProjectDoc["etapaStatus"];
      tables: McaProjectDoc["tables"];
      dwgGcsPath: string;
    }>;
    const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (body.title) patch.title = body.title.slice(0, 200);
    if (body.meta) patch.meta = { ...project.meta, ...body.meta };
    if (body.perimeterGeoJson) patch.perimeterGeoJson = body.perimeterGeoJson;
    if (body.currentEtapa != null) patch.currentEtapa = body.currentEtapa;
    if (body.etapaStatus) patch.etapaStatus = body.etapaStatus;
    if (body.tables) patch.tables = body.tables;
    if (body.dwgGcsPath) patch.dwgGcsPath = body.dwgGcsPath;
    await studyMapsAdminDb().collection(COL).doc(params.id).update(patch);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 400 },
    );
  }
}
