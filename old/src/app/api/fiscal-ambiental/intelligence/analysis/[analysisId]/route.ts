import { NextResponse } from "next/server";
import { getChangeAnalysis } from "@/lib/fiscal-ambiental/change-analysis-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../../_fad-api-guard";

type RouteContext = { params: Promise<{ analysisId: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { analysisId } = await context.params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_QUERY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const analysis = await getChangeAnalysis(workspaceId, analysisId);
    if (!analysis) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Análise não encontrada." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: analysis });
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
