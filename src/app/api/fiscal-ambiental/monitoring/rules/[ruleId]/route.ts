import { NextResponse } from "next/server";
import {
  deleteMonitoringRule,
  updateMonitoringRule,
} from "@/lib/fiscal-ambiental/monitoring-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../../_fad-api-guard";

type RouteContext = { params: Promise<{ ruleId: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { ruleId } = await context.params;
    const body = (await req.json()) as {
      workspaceId?: string;
      name?: string;
      frequency?: string;
      enabled?: boolean;
    };

    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_BODY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const rule = await updateMonitoringRule(workspaceId, ruleId, {
      name: body.name?.trim(),
      enabled: body.enabled,
    });

    if (!rule) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Regra não encontrada." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: rule });
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

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { ruleId } = await context.params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_QUERY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const deleted = await deleteMonitoringRule(workspaceId, ruleId);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Regra não encontrada." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: { deleted: true } });
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
