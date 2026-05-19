import { NextRequest, NextResponse } from "next/server";
import { suggestEmpreendedorAutofill } from "@/ai/flows/suggest-empreendedor-autofill";
import { isAiRoutesEnabled } from "@/lib/deploy-flags";
import { adminApiErrorResponse, requireAdminApiAuth } from "@/lib/api-auth";

type Body = {
  cpf?: string;
  hardContextJson?: string;
  evidenceText?: string;
};

export async function POST(request: NextRequest) {
  if (!isAiRoutesEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Autofill por IA está desativado temporariamente para estabilização do deploy.",
      },
      { status: 503 },
    );
  }

  try {
    await requireAdminApiAuth(request);
    const body = (await request.json()) as Body;
    const cpf = (body.cpf || "").trim();
    if (!cpf) {
      return NextResponse.json(
        { success: false, error: "CPF é obrigatório." },
        { status: 400 },
      );
    }

    const result = await suggestEmpreendedorAutofill({
      cpf,
      hardContextJson: body.hardContextJson || "",
      evidenceText: body.evidenceText || "",
    });

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions || [],
    });
  } catch (error) {
    const { message, status, code } = adminApiErrorResponse(error);
    if (status !== 500) {
      return NextResponse.json(
        { success: false, error: message, code },
        { status },
      );
    }
    console.error("POST /api/ai-lab/autofill-empreendedor:", error);
    return NextResponse.json(
      {
        success: false,
        error: message || "Falha no autofill.",
      },
      { status },
    );
  }
}
