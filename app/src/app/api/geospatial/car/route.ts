import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import {
  fetchCarByCodImovel,
  queryCarsInPerimeter,
} from "@/lib/geospatial/sicar-car-service";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";

type BodyByCod = {
  codImovel?: string;
};

type BodyByGeometry = {
  dataType?: PerimeterParseInput["dataType"];
  data?: string;
};

export async function POST(req: Request) {
  try {
    await requireAuthenticatedApi(req);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  try {
    const body = (await req.json()) as BodyByCod & BodyByGeometry;

    if (body.codImovel?.trim()) {
      const result = await fetchCarByCodImovel(body.codImovel);
      return NextResponse.json(
        {
          success: result.ok,
          mode: "codImovel",
          ...result,
        },
        { status: result.ok ? 200 : 404 },
      );
    }

    if (body.dataType && body.data) {
      const result = await queryCarsInPerimeter({
        dataType: body.dataType,
        data: body.data,
      });
      return NextResponse.json(
        {
          success: result.ok,
          mode: "geometry",
          ...result,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Informe codImovel ou dataType + data." },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao consultar CAR no SICAR.",
      },
      { status: 500 },
    );
  }
}
