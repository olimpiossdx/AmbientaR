import { NextResponse } from "next/server";
import { runChangeDetection } from "@/lib/fiscal-ambiental/change-analysis-service";
import { requireFadWorkspaceAccess } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

export const maxDuration = 300;

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

    const analysis = await runChangeDetection({
      workspace,
      ownerId: user.uid,
      beforeMosaicId,
      afterMosaicId,
    });

    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      const status = (err as Error & { status: number }).status;
      return NextResponse.json(
        { ok: false, error: { code: "ERROR", message: err.message } },
        { status },
      );
    }
    const message = err instanceof Error ? err.message : "Falha na detecção de mudanças.";
    return NextResponse.json(
      { ok: false, error: { code: "DETECT_FAILED", message } },
      { status: 502 },
    );
  }
}
