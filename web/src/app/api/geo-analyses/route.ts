import { NextRequest, NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { listGeoAnalysesForUserServer } from "@/lib/geospatial/list-geo-analyses-server";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthenticatedApi(req);
    const empreendimentoId =
      req.nextUrl.searchParams.get("empreendimentoId")?.trim() || undefined;
    const limitRaw = req.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;

    const analyses = await listGeoAnalysesForUserServer(user.uid || user.id, {
      empreendimentoId,
      limit: Number.isFinite(limit) ? limit : 25,
    });

    return NextResponse.json({ success: true, analyses });
  } catch (e) {
    return apiAuthErrorResponse(e);
  }
}
