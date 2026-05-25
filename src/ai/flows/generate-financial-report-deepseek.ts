"use server";

import { z } from "zod";
import { deepseekJsonCompletion } from "@/lib/ai-deepseek-json";
import type {
  GenerateFinancialReportInput,
  GenerateFinancialReportOutput,
} from "@/lib/types";

const OutSchema = z.object({
  report: z.string().min(1),
});

export async function generateFinancialReportDeepseek(
  input: GenerateFinancialReportInput,
  apiKey: string,
): Promise<GenerateFinancialReportOutput> {
  const user = [
    "Gere relatório financeiro em português (Brasil), moeda R$.",
    `Receitas: ${JSON.stringify(input.revenues)}`,
    `Despesas: ${JSON.stringify(input.expenses)}`,
    `Contexto: ${input.context ?? ""}`,
    'Responda só com JSON: { "report": "..." }',
  ].join("\n");

  return deepseekJsonCompletion(apiKey, {
    system:
      "Contador/analista financeiro para consultoria ambiental. Inclua resumo, detalhamento, análise e nota de que deve ser revisado por contador para fins fiscais.",
    user,
    schema: OutSchema,
    max_tokens: 4096,
  });
}
