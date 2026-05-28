import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { verifyEtapaForProjectAsync, etapaChecksPass } from "@/lib/mca/debug";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { n: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const etapa = Number(params.n);
    const projectId = req.nextUrl.searchParams.get("projectId");
    let project;
    if (projectId) {
      project = (await loadMcaProject(projectId, user.uid)) ?? undefined;
    }
    const checks = await verifyEtapaForProjectAsync(etapa, project, projectId ?? undefined);
    const pass = etapaChecksPass(checks);

    if (pass && projectId && project) {
      const key = String(etapa).padStart(2, "0");
      const etapaStatus = { ...(project.etapaStatus ?? {}), [key]: "pass" as const };
      const nextEtapa = Math.min(15, Math.max(project.currentEtapa ?? 4, etapa + 1));
      await studyMapsAdminDb()
        .collection("mca_projects")
        .doc(projectId)
        .update({
          etapaStatus,
          currentEtapa: nextEtapa,
          updatedAt: FieldValue.serverTimestamp(),
        });
    }

    return NextResponse.json({
      success: true,
      etapa,
      pass,
      checks,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 401 },
    );
  }
}
