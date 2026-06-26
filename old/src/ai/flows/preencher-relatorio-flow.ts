"use server";

/**
 * Fluxo de IA para preencher rascunho de relatório com base em dados do processo.
 * Entrada: dados resumidos do empreendimento/empreendedor/local.
 * Saída: texto em Markdown para revisão.
 */

import { ai, aiModel } from "@/ai/genkit";
import { z } from "genkit";

const PreencherRelatorioInputSchema = z.object({
  tipoDocumento: z.string().describe("Ex: RCA, PTRF, PRADA"),
  empreendimentoNome: z.string(),
  empreendedorNome: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  atividade: z.string().optional(),
  numeroCAR: z.string().optional(),
});

const PreencherRelatorioOutputSchema = z.object({
  conteudo: z.string().describe("Rascunho em Markdown"),
  resumo: z.string().optional(),
});

const prompt = ai.definePrompt({
  name: "preencherRelatorioPrompt",
  model: aiModel,
  input: { schema: PreencherRelatorioInputSchema },
  output: { schema: PreencherRelatorioOutputSchema },
  prompt: `Você é o AmbientaR, assistente técnico em consultoria ambiental (MG/Brasil). Gere um rascunho da seção "Caracterização do Empreendimento" para o documento "{{{tipoDocumento}}}".

Dados: Empreendimento: {{{empreendimentoNome}}}. Empreendedor: {{{empreendedorNome}}}. Município/UF: {{{municipio}}} / {{{uf}}}. Atividade: {{{atividade}}}. CAR: {{{numeroCAR}}}.

Regras: português, tom técnico; use só os dados acima; se faltar algo, escreva "A ser complementado". Formato: Markdown com título "1. Caracterização do Empreendimento" e parágrafos curtos (máx. ~15 linhas).

Retorne JSON: { "conteudo": "...", "resumo": "uma frase" }.`,
});

const flow = ai.defineFlow(
  {
    name: "preencherRelatorioFlow",
    inputSchema: PreencherRelatorioInputSchema,
    outputSchema: PreencherRelatorioOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, { model: aiModel });
    if (!output) throw new Error("IA não retornou conteúdo.");
    return output;
  },
);

export type PreencherRelatorioInput = z.infer<
  typeof PreencherRelatorioInputSchema
>;
export type PreencherRelatorioOutput = z.infer<
  typeof PreencherRelatorioOutputSchema
>;

export async function preencherRelatorio(
  input: PreencherRelatorioInput,
): Promise<PreencherRelatorioOutput> {
  return await flow(input);
}
