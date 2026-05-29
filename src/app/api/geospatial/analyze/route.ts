import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { fetchCarData, runGeospatialOverlay } from "@/lib/geospatial/geo-analysis-service";

type BodyShape = {
  dataType?: "car" | "coordinates" | "polygon" | "kml" | "shp";
  data?: string;
};

export async function POST(req: Request) {
  try {
    await requireAuthenticatedApi(req);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  try {
    const body = (await req.json()) as BodyShape;
    if (!body?.dataType || !body?.data) {
      return NextResponse.json(
        { error: "dataType e data são obrigatórios." },
        { status: 400 },
      );
    }

    const overlay = await runGeospatialOverlay(body.data, body.dataType);
    let carData = null;
    if (body.dataType === "car") {
      try {
        carData = await fetchCarData(body.data);
      } catch {
        carData = null;
      }
    } else if (overlay.carImoveis?.length === 1) {
      carData = {
        codImovel: overlay.carImoveis[0].codImovel,
        areaTotal: overlay.carImoveis[0].areaHa,
        situacao: overlay.carImoveis[0].situacao,
        statusCodigo: overlay.carImoveis[0].statusCodigo,
        condicao: overlay.carImoveis[0].condicao,
        municipio: overlay.carImoveis[0].municipio,
        uf: overlay.carImoveis[0].uf,
        fonte: "sicar-wfs-publico" as const,
      };
    }

    return NextResponse.json(
      {
        success: true,
        generatedAtUtc: new Date().toISOString(),
        input: {
          dataType: body.dataType,
          data: body.data,
        },
        carData,
        carImoveis: overlay.carImoveis ?? [],
        overlay,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao processar análise geoespacial.",
      },
      { status: 500 },
    );
  }
}
