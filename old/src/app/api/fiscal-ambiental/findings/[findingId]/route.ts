import { NextResponse } from "next/server";
import { updateFiscalFinding } from "@/lib/fiscal-ambiental/fiscal-finding-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import type { UpdateFadFiscalFindingInput } from "@/lib/fiscal-ambiental/types";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

type Params = { params: { findingId: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireFadApiAuth(req);
    const findingId = params.findingId?.trim();
    const body = (await req.json()) as {
      workspaceId?: string;
      status?: UpdateFadFiscalFindingInput["status"];
      dismissedReason?: string;
    };

    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId || !findingId) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_BODY", message: "workspaceId e findingId são obrigatórios." },
        },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const finding = await updateFiscalFinding({
      workspaceId,
      findingId,
      userId: user.uid,
      input: {
        status: body.status,
        dismissedReason: body.dismissedReason,
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
