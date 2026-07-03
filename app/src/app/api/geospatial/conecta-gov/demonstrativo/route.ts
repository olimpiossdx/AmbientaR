import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import {
  fetchConectaGovDemonstrativo,
  isConectaGovConfigured,
} from "@/lib/geospatial/conecta-gov-sicar";

type BodyShape = { codImovel?: string };

export async function POST(req: Request) {
  try {
    await requireAuthenticatedApi(req);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  if (!isConectaGovConfigured()) {
    return NextResponse.json(
      {
        error:
          "Conecta Gov não configurado. Defina CONECTA_GOV_SICAR_ENABLED=true e credenciais de órgão.",
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as BodyShape;
    const cod = body.codImovel?.trim();
    if (!cod || cod.length < 10) {
      return NextResponse.json(
        { error: "codImovel é obrigatório." },
        { status: 400 },
      );
    }
    const demonstrativo = await fetchConectaGovDemonstrativo(cod);
    return NextResponse.json({ success: true, demonstrativo });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao consultar Conecta Gov.",
      },
      { status: 502 },
    );
  }
}
