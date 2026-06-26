import { NextResponse } from "next/server";
import { fetchInpeAvailabilityForYear } from "@/lib/fiscal-ambiental/inpe-stac-client";
import { requireFadWorkspaceAccess } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const body = (await req.json()) as { workspaceId?: string; year?: number };
    const workspaceId = body.workspaceId?.trim();
    const year = Number(body.year);
    if (!workspaceId || !Number.isFinite(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_BODY", message: "workspaceId e year são obrigatórios." } },
        { status: 400 },
      );
    }

    const workspace = await requireFadWorkspaceAccess(
      workspaceId,
      user.uid,
      user.role === "admin",
    );

    const days = await fetchInpeAvailabilityForYear(workspace.aoi!, year);
    return NextResponse.json({ ok: true, data: { year, days } });
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
