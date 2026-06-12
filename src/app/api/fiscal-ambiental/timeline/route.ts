import { NextResponse } from "next/server";
import {
  createTimelineEvent,
  listUnifiedTimeline,
} from "@/lib/fiscal-ambiental/timeline-service";
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
    const events = await listUnifiedTimeline(workspaceId);
    return NextResponse.json({ ok: true, data: events });
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
      body?: string;
      occurredAt?: string;
    };

    const workspaceId = body.workspaceId?.trim();
    const title = body.title?.trim();
    if (!workspaceId || !title) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_BODY", message: "workspaceId e title são obrigatórios." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const event = await createTimelineEvent(workspaceId, user.uid, {
      kind: "manual_note",
      title,
      body: body.body,
      occurredAt: body.occurredAt,
    });

    return NextResponse.json({ ok: true, data: event }, { status: 201 });
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
