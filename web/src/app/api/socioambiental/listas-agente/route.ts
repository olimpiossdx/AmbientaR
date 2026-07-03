import { NextRequest, NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { consultarListasAgente } from "@/lib/socioambiental/listas-agente.server";

export async function POST(req: NextRequest) {
  try {
    await requireAuthenticatedApi(req);
    const body = (await req.json()) as {
      documento?: string;
      criterioIds?: string[];
      codImovel?: string;
      beneficiariosCpr?: string[];
    };

    const documento = String(body.documento ?? "").trim();
    const codImovel = String(body.codImovel ?? "").trim() || undefined;
    const beneficiariosCpr = Array.isArray(body.beneficiariosCpr)
      ? body.beneficiariosCpr.map((d) => String(d).replace(/\D/g, "")).filter(Boolean)
      : undefined;

    if (!documento && !codImovel && !beneficiariosCpr?.length) {
      return NextResponse.json(
        {
          error:
            "Informe CPF/CNPJ do agente, CAR do imóvel ou beneficiários da CPR.",
        },
        { status: 400 },
      );
    }

    const result = await consultarListasAgente({
      documento,
      criterioIds: body.criterioIds,
      codImovel,
      beneficiariosCpr,
    });

    return NextResponse.json({ success: true, result });
  } catch (e) {
    return apiAuthErrorResponse(e);
  }
}
