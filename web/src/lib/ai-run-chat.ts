"use server";

import {
  classifyChatTask,
  missingProviderMessage,
  resolvePrimaryProvider,
  type AiTaskKind,
} from "@/lib/ai-router";
import { getDeepseekApiKey } from "@/lib/deepseek-env";
import { getGeminiApiKey } from "@/lib/gemini-env";
import {
  deepseekChatCompletion,
  type DeepseekChatInput,
} from "@/lib/deepseek-chat-server";
import { geminiChatCompletion } from "@/lib/gemini-chat-server";

export type RoutedChatInput = DeepseekChatInput & {
  /** Força tarefa (ex.: rag, mcp) em vez de inferir só pelo tipo. */
  task?: AiTaskKind;
};

export type RoutedChatResult =
  | {
      ok: true;
      reply: string;
      model: string;
      tipo: string;
      provider: "gemini" | "deepseek";
    }
  | { ok: false; error: string; httpStatus?: number };

/**
 * Chat com roteamento: leve → Gemini; pesado → DeepSeek; fallback cruzado se um falhar.
 */
export async function routedChatCompletion(
  input: RoutedChatInput,
): Promise<RoutedChatResult> {
  const prompt =
    input.prompt ??
    (Array.isArray(input.messages)
      ? input.messages.map((m) => m.content).join("\n")
      : "");
  const task =
    input.task ??
    classifyChatTask(input.tipo, typeof prompt === "string" ? prompt : "");
  const charCount = typeof prompt === "string" ? prompt.length : 0;
  const primary = resolvePrimaryProvider(
    task,
    charCount,
    typeof prompt === "string" ? prompt : "",
  );

  const geminiKey = getGeminiApiKey();
  const deepseekKey = getDeepseekApiKey();

  const tryGemini = async (): Promise<RoutedChatResult | null> => {
    if (!geminiKey) return null;
    const r = await geminiChatCompletion(input, geminiKey);
    if (r.ok) {
      return { ...r, provider: "gemini" as const };
    }
    return { ok: false as const, error: r.error, httpStatus: r.httpStatus };
  };

  const tryDeepseek = async (): Promise<RoutedChatResult | null> => {
    if (!deepseekKey) return null;
    const r = await deepseekChatCompletion(input, deepseekKey);
    if (r.ok) {
      return { ...r, provider: "deepseek" as const };
    }
    return { ok: false as const, error: r.error, httpStatus: r.httpStatus };
  };

  if (primary === "gemini") {
    const g = await tryGemini();
    if (g?.ok) return g;
    const d = await tryDeepseek();
    if (d?.ok) return d;
    return {
      ok: false,
      error:
        g?.error ||
        d?.error ||
        `${missingProviderMessage("gemini")} ${missingProviderMessage("deepseek")}`,
      httpStatus: g?.httpStatus ?? d?.httpStatus ?? 503,
    };
  }

  const d = await tryDeepseek();
  if (d?.ok) return d;
  const g = await tryGemini();
  if (g?.ok) return g;
  return {
    ok: false,
    error:
      d?.error ||
      g?.error ||
      `${missingProviderMessage("deepseek")} ${missingProviderMessage("gemini")}`,
    httpStatus: d?.httpStatus ?? g?.httpStatus ?? 503,
  };
}
