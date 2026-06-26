"use server";

import { z } from "zod";
import { deepseekJsonCompletion } from "@/lib/ai-deepseek-json";
import type {
  GenerateAbntReportInput,
  GenerateAbntReportOutput,
} from "@/ai/flows/generate-abnt-report";

const AbntDeepseekSchema = z.object({
  report: z.string().min(1),
  citations: z.array(
    z.object({
      title: z.string(),
      url: z.string().optional(),
      sourceType: z.enum(["internal", "external"]),
      justification: z.string(),
    }),
  ),
});

function buildSourcesBlock(input: GenerateAbntReportInput): string {
  return input.sources
    .map((s, i) => {
      const url = s.url ? ` (${s.url})` : "";
      return `[${i + 1}] [${s.sourceType}] ${s.title}${url}\n${s.content}`;
    })
    .join("\n\n---\n\n");
}

export async function generateAbntReportDeepseek(
  input: GenerateAbntReportInput,
  apiKey: string,
): Promise<GenerateAbntReportOutput> {
  const sourcesText = buildSourcesBlock(input);
  const user = [
    `Título do relatório: ${input.reportTitle}`,
    `Objetivo: ${input.objective}`,
    input.additionalInstructions
      ? `Instruções adicionais: ${input.additionalInstructions}`
      : "",
    "",
    "FONTES (use apenas estas informações):",
    sourcesText,
    "",
    "Responda com um único JSON:",
    '{ "report": "texto completo em pt-BR com seções Título, Resumo executivo, Desenvolvimento, Conclusões, Limitações",',
    '"citations": [{ "title", "url?", "sourceType": "internal"|"external", "justification" }] }',
  ]
    .filter(Boolean)
    .join("\n");

  return deepseekJsonCompletion(apiKey, {
    system: `Você é redator técnico ambiental (Brasil, pt-BR). Não invente dados fora das fontes. Se houver conflito entre fontes, indique no texto.`,
    user,
    schema: AbntDeepseekSchema,
    max_tokens: 8192,
  });
}
