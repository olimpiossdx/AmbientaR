import { NextRequest, NextResponse } from "next/server";
import { isAiRoutesEnabled } from "@/lib/deploy-flags";
import { routedChatCompletion } from "@/lib/ai-run-chat";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { PETITION_SECTION_META } from "@/lib/multas-defesas/petition-templates";
import type { PetitionSectionId } from "@/lib/multas-defesas/types";

export const maxDuration = 90;

type Body = {
  sectionId: PetitionSectionId;
  autoResumo?: string;
  orgao?: string;
  pedidoUsuario?: string;
};

export async function POST(request: NextRequest) {
  if (!isAiRoutesEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Rotas de IA desativadas. Ative ENABLE_AI_ROUTES no ambiente.",
      },
      { status: 503 },
    );
  }

  try {
    await requireAuthenticatedApi(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  const meta = PETITION_SECTION_META.find((m) => m.id === body.sectionId);
  if (!meta) {
    return NextResponse.json(
      { success: false, error: "sectionId inválido." },
      { status: 400 },
    );
  }

  const prompt = [
    `Elabore texto para a seção "${meta.label}" de uma DEFESA ADMINISTRATIVA ambiental em Minas Gerais.`,
    `Base legal: Decreto Estadual nº 47.383/2018 (arts. 33–37, 59–60).`,
    `Órgão autuador: ${body.orgao || "não informado"}.`,
    body.autoResumo?.trim()
      ? `Contexto do auto e fatos:\n${body.autoResumo.trim()}`
      : "",
    body.pedidoUsuario?.trim()
      ? `Orientação do advogado/técnico:\n${body.pedidoUsuario.trim()}`
      : "",
    "Responda em português, tom formal, parágrafos prontos para colar na petição.",
    "Não invente números de processo; use [INSERIR …] quando faltar dado.",
    "Cite artigos do Decreto 47.383/2018 quando pertinente.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await routedChatCompletion({
    prompt,
    tipo: "geral",
    system:
      "Você é advogado ambientalista sênior em MG (SEMAD, FEAM, IGAM, IEF). Produza apenas o texto da seção solicitada.",
    systemPrefix:
      "Tarefa: redigir seção de defesa administrativa contra auto de infração.",
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.httpStatus === 400 ? 400 : 502 },
    );
  }

  return NextResponse.json({
    success: true,
    sectionId: body.sectionId,
    text: result.reply,
    provider: result.provider,
    model: result.model,
  });
}
