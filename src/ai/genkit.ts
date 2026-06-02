// @ts-nocheck
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

const hasGoogleKey =
  !!process.env.GOOGLE_GENAI_API_KEY || !!process.env.GEMINI_API_KEY;

const googleModelId =
  process.env.GENKIT_GOOGLE_MODEL?.trim() || "gemini-2.5-flash";

/** Genkit usa apenas Google Gemini — não há integração OpenAI/ChatGPT neste projeto. */
export const hasAiProvider = hasGoogleKey;

export const aiModel = googleAI.model(googleModelId);

/**
 * Fluxos Genkit (tarefas leves): modelo Flash via GOOGLE_GENAI_API_KEY / GEMINI_API_KEY.
 * Relatórios pesados usam DeepSeek em `src/lib/deepseek-*` e `src/ai/flows/*-deepseek.ts`.
 */
export const ai = genkit({
  plugins: hasGoogleKey ? [googleAI()] : [],
  ...(hasGoogleKey ? { defaultModel: aiModel } : {}),
});

if (!hasGoogleKey) {
  console.warn(
    "[Genkit] GOOGLE_GENAI_API_KEY ou GEMINI_API_KEY não definida — fluxos Genkit indisponíveis.",
  );
}
