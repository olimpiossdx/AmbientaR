import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";

const COL = "mca_projects";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; layerKey: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const project = await loadMcaProject(params.id, user.uid);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Não encontrado." },
        { status: 404 },
      );
    }
    const layerSnap = await studyMapsAdminDb()
      .collection(COL)
      .doc(params.id)
      .collection("layers")
      .doc(params.layerKey)
      .get();
    if (!layerSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Layer não encontrada." },
        { status: 404 },
      );
    }
    const data = layerSnap.data();
    return NextResponse.json({
      success: true,
      layerKey: params.layerKey,
      geojson: data?.geojson ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 401 },
    );
  }
}
