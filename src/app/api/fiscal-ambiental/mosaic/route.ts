import { NextResponse } from "next/server";
import { attachSignedUrls, listMosaicsForWorkspace } from "@/lib/fiscal-ambiental/mosaic-service";
import { requireFadWorkspaceAccess } from "@/lib/fiscal-ambiental/fad-workspace-access";
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

    await requireFadWorkspaceAccess(workspaceId, user.uid, user.role === "admin");

    const mosaics = await listMosaicsForWorkspace(workspaceId);
    const withUrls = await Promise.all(
      mosaics.filter((m) => m.status === "ready").map((m) => attachSignedUrls(m)),
    );

    return NextResponse.json({ ok: true, data: withUrls });
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
