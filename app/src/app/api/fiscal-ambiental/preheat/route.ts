import { NextResponse } from "next/server";
import { assembleMosaicForDate } from "@/lib/fiscal-ambiental/assemble-service";
import { fetchInpeAvailabilityForYear } from "@/lib/fiscal-ambiental/inpe-stac-client";
import { requireFadWorkspaceAccess } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../_fad-api-guard";

export const maxDuration = 300;

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

    const workspace = await requireFadWorkspaceAccess(
      workspaceId,
      user.uid,
      user.role === "admin",
    );

    const now = new Date();
    const years = [now.getFullYear(), now.getFullYear() - 1];
    let bestDate: string | null = null;
    let bestCloud = Infinity;

    for (const year of years) {
      const days = await fetchInpeAvailabilityForYear(workspace.aoi!, year);
      for (const d of days) {
        if (d.quality === "none") continue;
        const cloud = d.cloudCover ?? 50;
        if (cloud < bestCloud) {
          bestCloud = cloud;
          bestDate = d.date;
        }
      }
    }

    if (!bestDate) {
      return NextResponse.json({ ok: true, data: { skipped: true, reason: "no_recent_scene" } });
    }

    const mosaic = await assembleMosaicForDate({
      workspaceId,
      ownerId: user.uid,
      aoi: workspace.aoi!,
      date: bestDate,
    });

    return NextResponse.json({ ok: true, data: { mosaic, preheatedDate: bestDate } });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'preheat_failed';
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'PREHEAT_FAILED',
          message: reason,
        },
        data: {
          skipped: true,
          reason,
        },
      },
      { status: 502 },
    );
  }
}
