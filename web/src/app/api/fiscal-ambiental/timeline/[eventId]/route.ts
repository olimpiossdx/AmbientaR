import { NextResponse } from "next/server";
import {
  deleteTimelineEvent,
  getTimelineEvent,
  updateTimelineEvent,
} from "@/lib/fiscal-ambiental/timeline-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { eventId } = await context.params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_QUERY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");
    const event = await getTimelineEvent(workspaceId, eventId);
    if (!event) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Evento não encontrado." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: event });
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

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { eventId } = await context.params;
    const body = (await req.json()) as {
      workspaceId?: string;
      title?: string;
      body?: string;
      occurredAt?: string;
    };

    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_BODY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const event = await updateTimelineEvent(workspaceId, eventId, {
      title: body.title,
      body: body.body,
      occurredAt: body.occurredAt,
    });

    if (!event) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Evento não encontrado." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: event });
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
    const { eventId } = await context.params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_QUERY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const deleted = await deleteTimelineEvent(workspaceId, eventId);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Evento não encontrado." } },
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
