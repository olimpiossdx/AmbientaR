import { NextResponse } from "next/server";
import { buildTimelapse } from "@/lib/fiscal-ambiental/compare-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

export async function POST(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const body = (await req.json()) as {
      workspaceId?: string;
      mosaicIds?: string[];
    };

    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_BODY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const frames = await buildTimelapse({
      workspaceId,
      mosaicIds: body.mosaicIds,
    });

    if (!frames.length) {
      return NextResponse.json(
        { ok: false, error: { code: "EMPTY", message: "Nenhuma imagem pronta no acervo." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: { frames } });
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
