import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { runWaveAAnalysis } from "@/lib/geospatial/run-wave-a-analysis";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";

type BodyShape = {
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
    if (!body?.dataType || !body?.data) {
      return NextResponse.json(
        { error: "dataType e data são obrigatórios." },
        { status: 400 },
      );
    }

    const result = await runWaveAAnalysis({
      dataType: body.dataType,
      data: body.data,
    });

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao processar análise geoespacial (Onda A).",
      },
      { status: 500 },
    );
  }
}
