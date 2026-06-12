import { NextResponse } from "next/server";
import {
  deleteEvidenceItem,
  getEvidenceItem,
} from "@/lib/fiscal-ambiental/evidence-service";
import { attachSignedUrls, getMosaic } from "@/lib/fiscal-ambiental/mosaic-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

type RouteContext = { params: Promise<{ evidenceId: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { evidenceId } = await context.params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_QUERY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");
    const item = await getEvidenceItem(workspaceId, evidenceId);
    if (!item) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Evidência não encontrada." } },
        { status: 404 },
      );
    }

    let enriched = { ...item } as Record<string, unknown>;
    if (item.beforeMosaicId) {
      const m = await getMosaic(workspaceId, item.beforeMosaicId);
      if (m) enriched.beforePreviewUrl = (await attachSignedUrls(m)).previewUrl;
    }
    if (item.afterMosaicId) {
      const m = await getMosaic(workspaceId, item.afterMosaicId);
      if (m) enriched.afterPreviewUrl = (await attachSignedUrls(m)).previewUrl;
    }

    return NextResponse.json({ ok: true, data: enriched });
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
    const { evidenceId } = await context.params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_QUERY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const deleted = await deleteEvidenceItem(workspaceId, evidenceId);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Evidência não encontrada." } },
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
