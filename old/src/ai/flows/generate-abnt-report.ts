"use server";

import { z } from "genkit";
import { ai, aiModel, hasAiProvider } from "@/ai/genkit";
import { generateAbntReportDeepseek } from "@/ai/flows/generate-abnt-report-deepseek";
import { getDeepseekApiKey } from "@/lib/deepseek-env";

const SourceSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
  content: z.string(),
  sourceType: z.enum(["internal", "external"]),
});

const GenerateAbntReportInputSchema = z.object({
  reportTitle: z.string(),
  objective: z.string(),
  additionalInstructions: z.string().optional(),
  sources: z.array(SourceSchema).min(1),
});

const GenerateAbntReportOutputSchema = z.object({
  report: z.string(),
  citations: z.array(
    z.object({
      title: z.string(),
      url: z.string().optional(),
      sourceType: z.enum(["internal", "external"]),
      justification: z.string(),
    }),
  ),
});

export type GenerateAbntReportInput = z.infer<
  typeof GenerateAbntReportInputSchema
>;
export type GenerateAbntReportOutput = z.infer<
  typeof GenerateAbntReportOutputSchema
>;

const prompt = ai.definePrompt({
  name: "generateAbntReportPrompt",
  model: aiModel,
  input: { schema: GenerateAbntReportInputSchema },
  output: { schema: GenerateAbntReportOutputSchema },
  prompt: `Você é um redator técnico especializado em estudos ambientais no Brasil.

Tarefa:
1) Gerar um relatório técnico em português (pt-BR), com linguagem formal e objetiva.
2) Usar apenas informações presentes nas fontes fornecidas.
3) Quando a informação vier de fonte externa, mantenha rastreabilidade.
4) Estruturar o relatório com:
   - Título
   - Resumo executivo
   - Desenvolvimento (seções)
   - Conclusões
   - Limitações e recomendações

Contexto do relatório:
- Título: {{{reportTitle}}}
- Objetivo: {{{objective}}}
- Instruções adicionais: {{{additionalInstructions}}}

Fontes:
{{#each sources}}
- [{{sourceType}}] {{title}} {{#if url}}({{{url}}}){{/if}}
Conteúdo:
{{{content}}}
{{/each}}

Regras de qualidade:
- Não invente dados.
- Se houver conflito entre fontes, sinalize explicitamente.
- Retorne também uma lista de citações utilizadas com justificativa de uso de cada fonte.
`,
});

const generateAbntReportFlow = ai.defineFlow(
  {
    name: "generateAbntReportFlow",
    inputSchema: GenerateAbntReportInputSchema,
    outputSchema: GenerateAbntReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, { model: aiModel });
    return output!;
  },
);

export async function generateAbntReport(
  input: GenerateAbntReportInput,
): Promise<GenerateAbntReportOutput> {
  const deepseekKey = getDeepseekApiKey();
  if (deepseekKey) {
    return generateAbntReportDeepseek(input, deepseekKey);
  }
  if (!hasAiProvider) {
    throw new Error(
      "Relatório ABNT requer DEEPSEEK_API_KEY (tarefa pesada) ou GOOGLE_GENAI_API_KEY (Genkit).",
    );
  }
  return generateAbntReportFlow(input);
}
