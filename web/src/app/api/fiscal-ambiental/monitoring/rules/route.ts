import { NextResponse } from "next/server";
import {
  createMonitoringRule,
  listMonitoringRules,
} from "@/lib/fiscal-ambiental/monitoring-service";
import type { FadMonitoringFrequency } from "@/lib/fiscal-ambiental/types";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

const VALID_FREQ: FadMonitoringFrequency[] = [
  "monthly",
  "bimonthly",
  "quarterly",
  "semiannual",
  "annual",
  "manual",
];

export async function GET(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_QUERY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");
    const rules = await listMonitoringRules(workspaceId);
    return NextResponse.json({ ok: true, data: rules });
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

export async function POST(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const body = (await req.json()) as {
      workspaceId?: string;
      name?: string;
      frequency?: string;
    };

    const workspaceId = body.workspaceId?.trim();
    const name = body.name?.trim();
    const frequency = body.frequency as FadMonitoringFrequency;

    if (!workspaceId || !name || !frequency || !VALID_FREQ.includes(frequency)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_BODY", message: "workspaceId, name e frequency válidos são obrigatórios." },
        },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const rule = await createMonitoringRule(workspaceId, user.uid, { name, frequency });
    return NextResponse.json({ ok: true, data: rule }, { status: 201 });
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
