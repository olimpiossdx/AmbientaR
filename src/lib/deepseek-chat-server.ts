/**
 * Chamada à API DeepSeek (OpenAI-compatible). Usado pela rota `/api/ai/deepseek/chat`
 * e por Server Actions (ex.: assistente de estudos).
 */

export const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";
/** Modelo para tarefas pesadas (relatórios, RAG grande). */
export const DEEPSEEK_DEFAULT_MODEL =
  process.env.DEEPSEEK_HEAVY_MODEL?.trim() || "deepseek-v4-flash";
const MAX_USER_CHARS = 80_000;

export const DEEPSEEK_PRESET_SYSTEM: Record<string, string> = {
  mira:
    "Especialista MIRA/IGAM-MG: analise vazão, pH, níveis; sugira ações de conformidade (ANA/FEAM) de forma objetiva.",
  financeiro:
    "Assistente financeiro: analise faturas, contratos e fornecedores; sugira organização (DRE, custos ABC) quando aplicável.",
  rag: "Modo RAG: sintetize e cite apenas o que estiver nos dados enviados; não invente factos.",
  mcp: "Multi-contexto: cruze dados ambientais com operação (vendas/custos) quando fornecidos; responda em tópicos.",
  geral:
    "Assistente AmbientaR: apoio a gestão ambiental e operacional em português, claro e profissional.",
};

export type DeepseekChatRole = "system" | "user" | "assistant";

export type DeepseekChatMessage = {
  role: DeepseekChatRole;
  content: string;
};

export type DeepseekChatInput = {
  messages?: DeepseekChatMessage[];
  prompt?: string;
  system?: string;
  tipo?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  /** Anteposto ao preset de `tipo` (ex.: contexto de estudos técnicos). */
  systemPrefix?: string;
};

function clampText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\n\n[… texto truncado por limite de tamanho …]`;
}

function buildMessages(
  input: DeepseekChatInput,
): { ok: true; messages: DeepseekChatMessage[] } | { ok: false; error: string } {
  const tipo = (input.tipo || "geral").toLowerCase();
  const basePreset = DEEPSEEK_PRESET_SYSTEM[tipo] || DEEPSEEK_PRESET_SYSTEM.geral;
  const preset = input.systemPrefix
    ? `${input.systemPrefix.trim()}\n\n${basePreset}`
    : basePreset;

  if (Array.isArray(input.messages) && input.messages.length > 0) {
    const messages = input.messages.map((m) => ({
      role:
        m.role === "assistant" || m.role === "system" ? m.role : ("user" as const),
      content: clampText(String(m.content ?? ""), MAX_USER_CHARS),
    }));
    const hasSystem = messages.some((m) => m.role === "system");
    if (!hasSystem) {
      return {
        ok: true,
        messages: [{ role: "system", content: preset }, ...messages],
      };
    }
    return { ok: true, messages };
  }

  if (typeof input.prompt === "string" && input.prompt.trim()) {
    const sysParts = [preset];
    if (input.system?.trim()) sysParts.push(input.system.trim());
    return {
      ok: true,
      messages: [
        { role: "system", content: sysParts.join("\n\n") },
        { role: "user", content: clampText(input.prompt, MAX_USER_CHARS) },
      ],
    };
  }

  return {
    ok: false,
    error: "Envie `prompt` (string) ou `messages` (array com role/content).",
  };
}

function humanizeDeepseekApiError(message: string): string {
  const m = message.trim().toLowerCase();
  if (m.includes("insufficient balance")) {
    return "Saldo insuficiente na conta DeepSeek. Adicione créditos em https://platform.deepseek.com (facturação / recarga) e tente de novo.";
  }
  if (m.includes("invalid api key") || m.includes("incorrect api key")) {
    return "Chave de API DeepSeek inválida. Verifique DEEPSEEK_API_KEY no servidor e reinicie a aplicação.";
  }
  if (m.includes("rate limit")) {
    return "Limite de pedidos da DeepSeek atingido. Aguarde um momento e tente novamente.";
  }
  return message;
}

export async function deepseekChatCompletion(
  input: DeepseekChatInput,
  apiKey: string,
): Promise<
  | { ok: true; reply: string; model: string; tipo: string }
  | { ok: false; error: string; httpStatus?: number }
> {
  const built = buildMessages(input);
  if (!built.ok) return { ok: false, error: built.error, httpStatus: 400 };

  const tipo = (input.tipo || "geral").toLowerCase();
  const model =
    typeof input.model === "string" && input.model.trim()
      ? input.model.trim()
      : DEEPSEEK_DEFAULT_MODEL;
  const temperature =
    typeof input.temperature === "number" && Number.isFinite(input.temperature)
      ? Math.min(2, Math.max(0, input.temperature))
      : 0.2;
  const max_tokens =
    typeof input.max_tokens === "number" && input.max_tokens > 0
      ? Math.min(8192, Math.floor(input.max_tokens))
      : 2048;

  try {
    const res = await fetch(DEEPSEEK_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: built.messages,
        temperature,
        max_tokens,
      }),
    });

    const raw = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      data = { raw };
    }

    if (!res.ok) {
      const errMsg =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error?: { message?: string } }).error?.message ===
          "string"
          ? (data as { error: { message: string } }).error.message
          : `DeepSeek HTTP ${res.status}`;
      return {
        ok: false,
        error: humanizeDeepseekApiError(errMsg),
        httpStatus: res.status,
      };
    }

    const choices = (data as { choices?: Array<{ message?: { content?: string | null } }> })
      ?.choices;
    const reply = choices?.[0]?.message?.content?.trim() || "";

    return { ok: true, reply, model, tipo };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Falha ao contactar DeepSeek.",
    };
  }
}
