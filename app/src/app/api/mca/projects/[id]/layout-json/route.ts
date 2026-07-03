import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { buildLayoutJson } from "@/lib/mca/layout/build-layout-json";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import type { FeatureCollection } from "geojson";

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

    if (project.layoutJson) {
      return NextResponse.json({ success: true, layoutJson: project.layoutJson });
    }

    const snap = await studyMapsAdminDb()
      .collection("mca_projects")
      .doc(params.id)
      .collection("layers")
      .get();
    const layers = new Map<string, FeatureCollection>();
    snap.docs.forEach((d) => {
      const geo = d.data().geojson as FeatureCollection | undefined;
      if (geo?.features?.length) layers.set(d.id, geo);
    });

    const layoutJson = buildLayoutJson(project, layers);
    return NextResponse.json({ success: true, layoutJson, generated: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 400 },
    );
  }
}
