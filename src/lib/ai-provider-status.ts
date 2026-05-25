import { hasAiProvider } from "@/ai/genkit";
import { getDeepseekApiKey } from "@/lib/deepseek-env";
import { hasGeminiApiKey } from "@/lib/gemini-env";
import type { AiProviderId } from "@/lib/ai-provider-labels";

/** Provedor esperado para tarefas pesadas (relatórios, análise ambiental). */
export function getHeavyTaskProvider(): AiProviderId | null {
  if (getDeepseekApiKey()) return "deepseek";
  if (hasGeminiApiKey() || hasAiProvider) return "gemini";
  return null;
}

/** Provedor esperado para tarefas leves (chat curto, autofill). */
export function getLightTaskProvider(): AiProviderId | null {
  if (hasGeminiApiKey()) return "gemini";
  if (getDeepseekApiKey()) return "deepseek";
  return null;
}
