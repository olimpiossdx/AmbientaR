import { NextRequest, NextResponse } from "next/server";
import {
  parseStudyMapsPerimeter,
  type StudyMapsPerimeterInput,
} from "@/lib/study-maps/parse-perimeter";
import { verifyBearerUid } from "@/lib/study-maps/verify-user";

export const maxDuration = 60;

type Body = {
  dataType?: StudyMapsPerimeterInput["dataType"];
  data?: string;
};

export async function POST(req: NextRequest) {
  try {
    await verifyBearerUid(req.headers.get("authorization"));

    const body = (await req.json()) as Body;
    const dataType = body.dataType;
    const data = typeof body.data === "string" ? body.data : "";

    if (!dataType || !["coordinates", "polygon", "kml", "shp", "car"].includes(dataType)) {
      return NextResponse.json(
        { success: false, error: "dataType inválido (coordinates, polygon, kml, shp ou car)." },
        { status: 400 },
      );
    }

    if (!data.trim()) {
      return NextResponse.json(
        { success: false, error: "Dados do perímetro em falta." },
        { status: 400 },
      );
    }

    const parsed = await parseStudyMapsPerimeter({ dataType, data });
    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Não foi possível obter polígono válido. Verifique GeoJSON/WKT, KML ou ZIP (.shp+.shx+.dbf).",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      geojson: parsed.polygon,
      areaHa: parsed.areaHa,
      bbox: parsed.bbox,
      source: dataType,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao processar perímetro.";
    const status = msg.includes("Sessão") || msg.includes("token") ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
