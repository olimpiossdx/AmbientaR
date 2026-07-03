/**
 * Roteamento de IA: tarefas leves → Gemini; tarefas pesadas → DeepSeek.
 *
 * Variáveis opcionais:
 * - IA_LIGHT_MAX_CHARS (padrão 6000): acima disso, chat/RAG/geo vão para DeepSeek
 * - IA_ROUTER=off — desativa roteamento (comportamento legado nos fluxos que checam)
 */

import { hasGeminiApiKey } from "@/lib/gemini-env";
import { getDeepseekApiKey } from "@/lib/deepseek-env";
import { hasAiProvider as hasGenkitProvider } from "@/ai/genkit";

export type AiTaskKind =
  | "chat_light"
  | "chat_heavy"
  | "analise_ambiental"
  | "abnt_report"
  | "financial_report"
  | "sustainability_report"
  | "preencher_relatorio"
  | "geo_complement"
  | "autofill"
  | "rag"
  | "mcp"
  | "generic";

export type AiProviderChoice = "gemini" | "deepseek";

/** Sempre DeepSeek quando a chave existir. */
export const ALWAYS_DEEPSEEK_TASKS: ReadonlySet<AiTaskKind> = new Set([
  "analise_ambiental",
  "abnt_report",
  "financial_report",
  "sustainability_report",
]);

/** Preferência Gemini (entrada pequena). */
export const PREFER_GEMINI_TASKS: ReadonlySet<AiTaskKind> = new Set([
  "chat_light",
  "preencher_relatorio",
  "autofill",
  "generic",
]);

const HEAVY_PROMPT_MARKERS = [
  "relatório completo",
  "relatorio completo",
  "gerar capítulo",
  "gerar capitulo",
  "elaborar estudo",
  "minuta completa",
  "texto longo",
  "abnt",
] as const;

export function isAiRouterEnabled(): boolean {
  const v = (process.env.IA_ROUTER || "on").trim().toLowerCase();
  return v !== "off" && v !== "0" && v !== "false";
}

export function getLightMaxChars(): number {
  const n = Number(process.env.IA_LIGHT_MAX_CHARS);
  if (Number.isFinite(n) && n > 500) return Math.floor(n);
  return 6000;
}

export function estimateCharCount(...parts: (string | undefined | null)[]): number {
  return parts.reduce((sum, p) => sum + (p?.length ?? 0), 0);
}

export function promptLooksHeavy(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return HEAVY_PROMPT_MARKERS.some((m) => lower.includes(m));
}

export function classifyChatTask(
  tipo: string | undefined,
  prompt: string,
): AiTaskKind {
  const t = (tipo || "geral").toLowerCase();
  const promptChars = prompt.length;
  if (t === "rag") return "rag";
  if (t === "mcp") return "mcp";
  if (promptLooksHeavy(prompt) || promptChars >= getLightMaxChars()) {
    return "chat_heavy";
  }
  return "chat_light";
}

/** Resolve provedor primário para uma tarefa. */
export function resolvePrimaryProvider(
  task: AiTaskKind,
  charCount = 0,
  promptForHeuristic = "",
): AiProviderChoice {
  if (!isAiRouterEnabled()) {
    if (getDeepseekApiKey()) return "deepseek";
    return hasGeminiApiKey() || hasGenkitProvider ? "gemini" : "deepseek";
  }

  if (ALWAYS_DEEPSEEK_TASKS.has(task)) return "deepseek";

  if (PREFER_GEMINI_TASKS.has(task)) return "gemini";

  if (task === "chat_heavy") return "deepseek";

  if (task === "rag" || task === "mcp" || task === "chat_light") {
    if (
      charCount >= getLightMaxChars() ||
      promptLooksHeavy(promptForHeuristic)
    ) {
      return "deepseek";
    }
    return "gemini";
  }

  if (task === "geo_complement") {
    return charCount >= getLightMaxChars() ? "deepseek" : "gemini";
  }

  return charCount >= getLightMaxChars() ? "deepseek" : "gemini";
}

export function canUseGemini(): boolean {
  return hasGeminiApiKey();
}

export function canUseDeepseek(): boolean {
  return !!getDeepseekApiKey();
}

export function missingProviderMessage(wanted: AiProviderChoice): string {
  if (wanted === "gemini") {
    return "Configure GOOGLE_GENAI_API_KEY em `.env.local` para consultas leves (Gemini).";
  }
  return "Configure DEEPSEEK_API_KEY em `.env.local` para relatórios e tarefas pesadas (DeepSeek).";
}
