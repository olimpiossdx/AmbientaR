import { NextResponse } from "next/server";
import {
  createEvidenceItem,
  listEvidenceWithUrls,
} from "@/lib/fiscal-ambiental/evidence-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
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
    const items = await listEvidenceWithUrls(workspaceId);
    return NextResponse.json({ ok: true, data: items });
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
      kind?: "comparison" | "timelapse" | "change_analysis";
      title?: string;
      description?: string;
      beforeMosaicId?: string;
      afterMosaicId?: string;
      mosaicIds?: string[];
      changeAnalysisId?: string;
    };

    const workspaceId = body.workspaceId?.trim();
    const title = body.title?.trim();
    if (!workspaceId || !body.kind || !title) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_BODY", message: "workspaceId, kind e title são obrigatórios." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const item = await createEvidenceItem(workspaceId, user.uid, {
      kind: body.kind,
      title,
      description: body.description,
      beforeMosaicId: body.beforeMosaicId,
      afterMosaicId: body.afterMosaicId,
      mosaicIds: body.mosaicIds,
      changeAnalysisId: body.changeAnalysisId,
    });

    return NextResponse.json({ ok: true, data: item }, { status: 201 });
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
