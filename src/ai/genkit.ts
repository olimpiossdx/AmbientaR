// @ts-nocheck
import { genkit } from "genkit";
import { openAI } from "@genkit-ai/compat-oai/openai";
import { googleAI } from "@genkit-ai/google-genai";

const hasGoogleKey =
  !!process.env.GOOGLE_GENAI_API_KEY || !!process.env.GEMINI_API_KEY;
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const hasOpenAIAliasKey = !!process.env.OPENAI_KEY;
/** google = só Gemini; openai = só OpenAI; vazio = OpenAI se houver chave, senão Gemini. */
const providerPref = (process.env.GENKIT_PROVIDER || "").toLowerCase();
const useOpenAI =
  providerPref === "google"
    ? false
    : providerPref === "openai"
      ? true
      : hasOpenAIKey || hasOpenAIAliasKey;

const googleModelId =
  process.env.GENKIT_GOOGLE_MODEL?.trim() || "gemini-2.0-flash";

export const aiModel = useOpenAI
  ? openAI.model("gpt-4o-mini")
  : googleAI.model(googleModelId);

/**
 * Estratégia de modelo padrão:
 * - OpenAI se houver OPENAI_API_KEY/OPENAI_KEY e não for forçado Google (GENKIT_PROVIDER=google).
 * - Gemini (Google AI) caso contrário, se houver GOOGLE_GENAI_API_KEY ou GEMINI_API_KEY.
 * - GENKIT_GOOGLE_MODEL: id do modelo (padrão gemini-2.0-flash).
 */
export const ai = genkit({
  plugins: [openAI(), googleAI()],
  defaultModel: aiModel,
});

if (!useOpenAI && !hasGoogleKey) {
  console.warn("[Genkit] Nenhuma chave de IA detectada (OPENAI/GEMINI).");
}
