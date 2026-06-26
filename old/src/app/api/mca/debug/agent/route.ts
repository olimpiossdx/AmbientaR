import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { runMcaAgent } from "@/lib/mca/agents/run-agent";
import { persistAgentLayer } from "@/lib/mca/persist-layer";
import { ensureProjectGeometry } from "@/lib/mca/geometry-build";
import { isValidPerimeter } from "@/lib/mca/perimeter";
import { getAgentDef } from "@/lib/mca/registry";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import type { McaAgentContext } from "@/lib/mca/types";
import type { FeatureCollection } from "geojson";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json()) as { agentId: string; projectId: string };
    if (!body.agentId || !body.projectId) {
      return NextResponse.json({ success: false, error: "agentId e projectId obrigatórios." }, { status: 400 });
    }
    const def = getAgentDef(body.agentId);
    if (!def) {
      return NextResponse.json({ success: false, error: "Agente desconhecido." }, { status: 404 });
    }
    const project = await loadMcaProject(body.projectId, user.uid);
    if (!project) {
      return NextResponse.json({ success: false, error: "Projeto não encontrado." }, { status: 404 });
    }

    const layers = new Map<string, FeatureCollection>();
    const layerSnap = await studyMapsAdminDb()
      .collection("mca_projects")
      .doc(body.projectId)
      .collection("layers")
      .get();
    for (const doc of layerSnap.docs) {
      const geo = doc.data().geojson;
      if (geo) layers.set(doc.id, geo as FeatureCollection);
    }

    const ctx: McaAgentContext = { project, layers, logs: [] };
    if (isValidPerimeter(project.perimeterGeoJson)) {
      ensureProjectGeometry(ctx);
    }

    const result = await runMcaAgent(body.agentId, ctx);
    await persistAgentLayer(body.projectId, result);
    return NextResponse.json({
      success: true,
      result,
      def,
      layerKeys: [...layers.keys()],
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}
