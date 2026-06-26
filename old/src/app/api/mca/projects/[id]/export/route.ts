import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";

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

    const layersSnap = await studyMapsAdminDb()
      .collection("mca_projects")
      .doc(params.id)
      .collection("layers")
      .get();

    const layers: Record<string, unknown> = {};
    layersSnap.docs.forEach((d) => {
      const geo = d.data().geojson;
      if (geo) layers[d.id] = geo;
    });

    const bundle = {
      version: "1.0",
      projectId: params.id,
      title: project.title,
      meta: project.meta,
      crs: project.meta.crs ?? "EPSG:31983",
      perimeterGeoJson: project.perimeterGeoJson ?? null,
      layers,
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(bundle, null, 2);
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="mca-${params.id}-layers.json"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Export falhou" },
      { status: 500 },
    );
  }
}
