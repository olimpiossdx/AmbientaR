import { NextResponse } from "next/server";
import {
  assertFadWorkspaceAccess,
  deleteFadWorkspace,
  getFadWorkspace,
  updateFadWorkspace,
} from "@/lib/fiscal-ambiental/workspace-service";
import { isGeoPolygon } from "@/lib/fiscal-ambiental/validators";
import type { UpdateFadWorkspaceInput } from "@/lib/fiscal-ambiental/types";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

type RouteContext = { params: Promise<{ workspaceId: string }> };

function parsePatchBody(body: unknown): UpdateFadWorkspaceInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const patch: UpdateFadWorkspaceInput = {};

  if (typeof b.name === "string") {
    const name = b.name.trim();
    if (!name || name.length > 200) return null;
    patch.name = name;
  }

  if (b.aoi !== undefined) {
    if (b.aoi === null) return null;
    if (!isGeoPolygon(b.aoi)) return null;
    patch.aoi = b.aoi;
  }

  if (typeof b.aoiSource === "string") patch.aoiSource = b.aoiSource as UpdateFadWorkspaceInput["aoiSource"];
  if (typeof b.carCode === "string") patch.carCode = b.carCode.trim().slice(0, 80);
  if (typeof b.status === "string") patch.status = b.status as UpdateFadWorkspaceInput["status"];

  if (Object.keys(patch).length === 0) return null;
  return patch;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { workspaceId } = await context.params;
    const workspace = await getFadWorkspace(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Workspace não encontrado." } },
        { status: 404 },
      );
    }

    const allowed = await assertFadWorkspaceAccess(
      workspace,
      user.uid,
      user.role === "admin",
    );
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Sem permissão." } },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true, data: workspace });
  } catch (err) {
    return handleFadApiError(err);
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { workspaceId } = await context.params;
    const workspace = await getFadWorkspace(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Workspace não encontrado." } },
        { status: 404 },
      );
    }

    const allowed = await assertFadWorkspaceAccess(
      workspace,
      user.uid,
      user.role === "admin",
    );
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Sem permissão." } },
        { status: 403 },
      );
    }

    const body = await req.json();
    const patch = parsePatchBody(body);
    if (!patch) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_BODY", message: "Nada para atualizar." } },
        { status: 400 },
      );
    }

    const updated = await updateFadWorkspace(workspaceId, user.uid, patch);
    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return handleFadApiError(err);
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { workspaceId } = await context.params;
    const workspace = await getFadWorkspace(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Workspace não encontrado." } },
        { status: 404 },
      );
    }

    const isOwner = workspace.ownerId === user.uid;
    if (!isOwner && user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Sem permissão." } },
        { status: 403 },
      );
    }

    await deleteFadWorkspace(workspaceId);
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (err) {
    return handleFadApiError(err);
  }
}
