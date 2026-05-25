// @ts-nocheck
import { genkit } from "genkit";
import { openAI } from "@genkit-ai/compat-oai/openai";
import { googleAI } from "@genkit-ai/google-genai";

const hasGoogleKey =
  !!process.env.GOOGLE_GENAI_API_KEY || !!process.env.GEMINI_API_KEY;
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const hasOpenAIAliasKey = !!process.env.OPENAI_KEY;
/** google (padrão) = Gemini; openai = só se GENKIT_PROVIDER=openai e houver chave OpenAI. */
const providerPref = (process.env.GENKIT_PROVIDER || "google").toLowerCase();
const useOpenAI =
  providerPref === "openai" && (hasOpenAIKey || hasOpenAIAliasKey);

const googleModelId =
  process.env.GENKIT_GOOGLE_MODEL?.trim() || "gemini-2.5-flash";

const enabledPlugins = [];
if (hasOpenAIKey || hasOpenAIAliasKey) {
  enabledPlugins.push(openAI());
}
if (hasGoogleKey) {
  enabledPlugins.push(googleAI());
}

export const hasAiProvider =
  hasGoogleKey || hasOpenAIKey || hasOpenAIAliasKey;

export const aiModel = useOpenAI
  ? openAI.model("gpt-4o-mini")
  : googleAI.model(googleModelId);

/**
 * Estratégia de modelo padrão (tarefas leves via Genkit):
 * - Gemini se houver GOOGLE_GENAI_API_KEY/GEMINI_API_KEY (padrão GENKIT_PROVIDER=google).
 * - OpenAI só com GENKIT_PROVIDER=openai.
 * - GENKIT_GOOGLE_MODEL: padrão gemini-2.5-flash.
 */
export const ai = genkit({
  plugins: enabledPlugins,
  ...(hasAiProvider ? { defaultModel: aiModel } : {}),
});

if (!useOpenAI && !hasGoogleKey) {
  console.warn("[Genkit] Nenhuma chave de IA detectada (OPENAI/GEMINI).");
}
