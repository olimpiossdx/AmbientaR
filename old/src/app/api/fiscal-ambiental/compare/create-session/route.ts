import { NextResponse } from "next/server";
import { createCompareSession } from "@/lib/fiscal-ambiental/compare-service";
import { requireFadWorkspaceAccess } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

export async function POST(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const body = (await req.json()) as {
      workspaceId?: string;
      beforeMosaicId?: string;
      afterMosaicId?: string;
    };

    const workspaceId = body.workspaceId?.trim();
    const beforeMosaicId = body.beforeMosaicId?.trim();
    const afterMosaicId = body.afterMosaicId?.trim();

    if (!workspaceId || !beforeMosaicId || !afterMosaicId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_BODY",
            message: "workspaceId, beforeMosaicId e afterMosaicId são obrigatórios.",
          },
        },
        { status: 400 },
      );
    }

    const workspace = await requireFadWorkspaceAccess(
      workspaceId,
      user.uid,
      user.role === "admin",
    );

    const session = await createCompareSession({
      workspace,
      beforeMosaicId,
      afterMosaicId,
    });

    return NextResponse.json({ ok: true, data: session });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      const status = (err as Error & { status: number }).status;
      return NextResponse.json(
        { ok: false, error: { code: "ERROR", message: err.message } },
        { status },
      );
    }
    const message = err instanceof Error ? err.message : "Falha ao criar sessão de comparação.";
    return NextResponse.json(
      { ok: false, error: { code: "COMPARE_FAILED", message } },
      { status: 502 },
    );
  }
}
