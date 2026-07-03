"use server";

import { z } from "genkit";
import { ai, aiModel } from "@/ai/genkit";

const AutofillFieldSchema = z.enum([
  "name",
  "email",
  "phone",
  "address",
  "numero",
  "bairro",
  "municipio",
  "uf",
  "cep",
  "dataNascimento",
  "ctfIbama",
]);

const AutofillSuggestionSchema = z.object({
  field: AutofillFieldSchema,
  suggestedValue: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  sourceCitations: z.array(z.string()).default([]),
});

const AutofillInputSchema = z.object({
  cpf: z.string(),
  hardContextJson: z.string().optional(),
  evidenceText: z.string().optional(),
});

const AutofillOutputSchema = z.object({
  suggestions: z.array(AutofillSuggestionSchema).default([]),
});

export type AutofillSuggestion = z.infer<typeof AutofillSuggestionSchema>;
export type AutofillInput = z.infer<typeof AutofillInputSchema>;
export type AutofillOutput = z.infer<typeof AutofillOutputSchema>;

const prompt = ai.definePrompt({
  name: "suggestEmpreendedorAutofillPrompt",
  model: aiModel,
  input: { schema: AutofillInputSchema },
  output: { schema: AutofillOutputSchema },
  prompt: `Você é um assistente de preenchimento de cadastro com foco em precisão.

Objetivo:
- Sugerir APENAS campos de cadastro de empreendedor quando houver evidência.
- Nunca inventar valor.
- Se houver dúvida, não sugerir o campo.

CPF consultado: {{{cpf}}}

Contexto estruturado (já validado internamente):
{{{hardContextJson}}}

Trechos/evidências textuais adicionais:
{{{evidenceText}}}

Regras:
1) Responda com JSON no formato exigido.
2) confidence deve refletir a certeza (0 a 1).
3) sourceCitations deve listar as fontes usadas (ex: "clients/abc123", "empreendedores/xyz456").
4) Não inclua campos sem valor.
5) Nunca altere CPF/CNPJ aqui.
`,
});

const flow = ai.defineFlow(
  {
    name: "suggestEmpreendedorAutofillFlow",
    inputSchema: AutofillInputSchema,
    outputSchema: AutofillOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, { model: aiModel });
    return output ?? { suggestions: [] };
  },
);

export async function suggestEmpreendedorAutofill(
  input: AutofillInput,
): Promise<AutofillOutput> {
  return flow(input);
}
