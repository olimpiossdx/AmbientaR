import { NextResponse } from "next/server";
import { runFiscalChecks } from "@/lib/fiscal-ambiental/fiscal-finding-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

export async function POST(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const body = (await req.json()) as { workspaceId?: string };
    const workspaceId = body.workspaceId?.trim();

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_BODY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const result = await runFiscalChecks({
      workspaceId,
      ownerId: user.uid,
    });

    return NextResponse.json({ ok: true, data: result });
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
