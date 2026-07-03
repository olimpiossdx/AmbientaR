import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { resolveLocalizacaoImovel } from "@/lib/geospatial/resolve-localizacao-imovel";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import type { ResolveLocalizacaoOptions } from "@/lib/types/localizacao-imovel";

type BodyShape = ResolveLocalizacaoOptions & {
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
    const body = (await req.json()) as BodyShape;

    if (!body.dataType || !body.data?.trim()) {
      return NextResponse.json(
        { error: "dataType e data são obrigatórios." },
        { status: 400 },
      );
    }

    const input: PerimeterParseInput = {
      dataType: body.dataType,
      data: body.data.trim(),
    };

    const resolved = await resolveLocalizacaoImovel(input, {
      codImovelSelecionado: body.codImovelSelecionado,
      gpsAccuracyM: body.gpsAccuracyM,
      extratoUfEsperada: body.extratoUfEsperada ?? "MG",
    });

    return NextResponse.json({
      success: resolved.status === "ok",
      resolved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao resolver localização do imóvel.",
      },
      { status: 500 },
    );
  }
}
