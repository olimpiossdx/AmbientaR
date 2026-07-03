import { NextResponse } from "next/server";
import { executeMonitoringRun } from "@/lib/fiscal-ambiental/monitoring-service";
import { requireFadWorkspaceAccess } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const body = (await req.json()) as { workspaceId?: string; ruleId?: string };

    const workspaceId = body.workspaceId?.trim();
    const ruleId = body.ruleId?.trim();

    if (!workspaceId || !ruleId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_BODY", message: "workspaceId e ruleId são obrigatórios." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceAccess(workspaceId, user.uid, user.role === "admin");

    const run = await executeMonitoringRun({
      workspaceId,
      ruleId,
      ownerId: user.uid,
    });

    return NextResponse.json({ ok: true, data: run });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      const status = (err as Error & { status: number }).status;
      return NextResponse.json(
        { ok: false, error: { code: "ERROR", message: err.message } },
        { status },
      );
    }
    const message = err instanceof Error ? err.message : "Falha no ciclo de monitoramento.";
    return NextResponse.json(
      { ok: false, error: { code: "MONITORING_FAILED", message } },
      { status: 502 },
    );
  }
}
