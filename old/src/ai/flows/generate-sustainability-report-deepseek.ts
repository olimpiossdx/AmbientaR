"use server";

import { z } from "zod";
import { deepseekJsonCompletion } from "@/lib/ai-deepseek-json";
import type {
  GenerateSustainabilityReportInput,
  GenerateSustainabilityReportOutput,
} from "@/lib/types";

const OutSchema = z.object({
  report: z.string().min(1),
});

export async function generateSustainabilityReportDeepseek(
  input: GenerateSustainabilityReportInput,
  apiKey: string,
): Promise<GenerateSustainabilityReportOutput> {
  const user = [
    "Gere relatório de sustentabilidade em português (Brasil), foco Minas Gerais.",
    `Dados do projeto: ${input.projectData}`,
    `Métricas ambientais: ${input.environmentalMetrics}`,
    `Contexto: ${input.context ?? ""}`,
    'Responda só com JSON: { "report": "..." }',
  ].join("\n");

  return deepseekJsonCompletion(apiKey, {
    system:
      "Especialista em sustentabilidade e legislação ambiental brasileira. Relatório completo para stakeholders.",
    user,
    schema: OutSchema,
    max_tokens: 4096,
  });
}
