import { NextRequest, NextResponse } from "next/server";
import { suggestEmpreendedorAutofill } from "@/ai/flows/suggest-empreendedor-autofill";

type Body = {
  cpf?: string;
  hardContextJson?: string;
  evidenceText?: string;
};

export async function POST(request: NextRequest) {
  try {
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
    console.error("POST /api/ai-lab/autofill-empreendedor:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Falha no autofill.",
      },
      { status: 500 },
    );
  }
}
