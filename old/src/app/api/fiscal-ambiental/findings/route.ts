import { NextResponse } from "next/server";
import {
  createManualFinding,
  listFiscalFindings,
} from "@/lib/fiscal-ambiental/fiscal-finding-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import type { CreateFadManualFindingInput } from "@/lib/fiscal-ambiental/types";
import { handleFadApiError, requireFadApiAuth } from "../_fad-api-guard";

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
    const findings = await listFiscalFindings(workspaceId);
    return NextResponse.json({ ok: true, data: findings });
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
      title?: string;
      description?: string;
      type?: CreateFadManualFindingInput["type"];
      severity?: CreateFadManualFindingInput["severity"];
    };

    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId || !body.title?.trim() || !body.description?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_BODY",
            message: "workspaceId, title e description são obrigatórios.",
          },
        },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const finding = await createManualFinding({
      workspaceId,
      ownerId: user.uid,
      input: {
        title: body.title,
        description: body.description,
        type: body.type,
        severity: body.severity,
      },
    });

    return NextResponse.json({ ok: true, data: finding });
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
