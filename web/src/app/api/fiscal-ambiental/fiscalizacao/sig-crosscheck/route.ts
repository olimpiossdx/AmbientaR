import { NextResponse } from "next/server";
import { isFadSigCrosscheckEnabled } from "@/lib/deploy-flags";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { runSigCrosscheck } from "@/lib/fiscal-ambiental/sig-crosscheck-service";
import { getFadWorkspace } from "@/lib/fiscal-ambiental/workspace-service";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

export const maxDuration = 120;

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

    if (!isFadSigCrosscheckEnabled()) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SIG_DISABLED",
            message: "Cruzamento SIG desativado. Defina FAD_ENABLE_SIG_CROSSCHECK=true.",
          },
        },
        { status: 503 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const workspace = await getFadWorkspace(workspaceId);
    if (!workspace?.aoi) {
      return NextResponse.json(
        { ok: false, error: { code: "NO_AOI", message: "Workspace sem área definida." } },
        { status: 400 },
      );
    }

    const data = await runSigCrosscheck({
      workspaceId,
      ownerId: user.uid,
      aoi: workspace.aoi,
    });

    return NextResponse.json({ ok: true, data });
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
