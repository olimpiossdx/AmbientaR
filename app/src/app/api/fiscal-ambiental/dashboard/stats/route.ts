import { NextResponse } from "next/server";
import { getFadDashboardStatsForOwner } from "@/lib/fiscal-ambiental/dashboard-stats-service";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

export async function GET(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const stats = await getFadDashboardStatsForOwner(user.uid);
    return NextResponse.json({ ok: true, data: stats });
  } catch (err) {
    return handleFadApiError(err);
  }
}
