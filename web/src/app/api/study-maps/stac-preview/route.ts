import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/study-maps/verify-user";
import {
  extractIntersectGeometry,
  searchSentinel2Preview,
} from "@/lib/study-maps/stac-sentinel";

type Body = { geojson?: unknown };

export async function POST(req: NextRequest) {
  try {
    await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json()) as Body;
    const geom = extractIntersectGeometry(body.geojson);
    if (!geom) {
      return NextResponse.json(
        { success: false, error: "GeoJSON inválido ou sem geometria." },
        { status: 400 },
      );
    }
    const items = await searchSentinel2Preview(geom);
    return NextResponse.json({ success: true, items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido.";
    const status = msg.includes("Token") ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
