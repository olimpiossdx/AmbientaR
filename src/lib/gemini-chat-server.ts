/**
 * Chat leve via Gemini API (REST). Paralelo ao DeepSeek para custo baixo no dia a dia.
 */

import { DEEPSEEK_PRESET_SYSTEM } from "@/lib/deepseek-chat-server";

export const GEMINI_DEFAULT_LIGHT_MODEL =
  process.env.GEMINI_LIGHT_MODEL?.trim() || "gemini-2.5-flash";

const MAX_USER_CHARS = 80_000;

export type GeminiChatInput = {
  prompt?: string;
  system?: string;
  tipo?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  systemPrefix?: string;
};

function clampText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\n\n[… texto truncado por limite de tamanho …]`;
}

function buildGeminiPayload(input: GeminiChatInput): {
  systemText: string;
  userText: string;
} | { error: string } {
  const tipo = (input.tipo || "geral").toLowerCase();
  const basePreset =
    DEEPSEEK_PRESET_SYSTEM[tipo] || DEEPSEEK_PRESET_SYSTEM.geral;
  const preset = input.systemPrefix
    ? `${input.systemPrefix.trim()}\n\n${basePreset}`
    : basePreset;
  const sysParts = [preset];
  if (input.system?.trim()) sysParts.push(input.system.trim());

  if (typeof input.prompt === "string" && input.prompt.trim()) {
    return {
      systemText: sysParts.join("\n\n"),
      userText: clampText(input.prompt, MAX_USER_CHARS),
    };
  }
  return { error: "Envie `prompt` (string)." };
}

export async function geminiChatCompletion(
  input: GeminiChatInput,
  apiKey: string,
): Promise<
  | { ok: true; reply: string; model: string; tipo: string }
  | { ok: false; error: string; httpStatus?: number }
> {
  const built = buildGeminiPayload(input);
  if ("error" in built) {
    return { ok: false, error: built.error, httpStatus: 400 };
  }

  const tipo = (input.tipo || "geral").toLowerCase();
  const model =
    typeof input.model === "string" && input.model.trim()
      ? input.model.trim()
      : GEMINI_DEFAULT_LIGHT_MODEL;
  const temperature =
    typeof input.temperature === "number" && Number.isFinite(input.temperature)
      ? Math.min(2, Math.max(0, input.temperature))
      : 0.2;
  const maxOutputTokens =
    typeof input.maxOutputTokens === "number" && input.maxOutputTokens > 0
      ? Math.min(8192, Math.floor(input.maxOutputTokens))
      : 2048;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: built.systemText }] },
        contents: [{ role: "user", parts: [{ text: built.userText }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      }),
    });

    const raw = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {
        ok: false,
        error: `Resposta inválida do Gemini (HTTP ${res.status}).`,
        httpStatus: res.status,
      };
    }

    if (!res.ok) {
      const err = data.error as { message?: string } | undefined;
      return {
        ok: false,
        error: err?.message || `Gemini HTTP ${res.status}`,
        httpStatus: res.status,
      };
    }

    const candidates = data.candidates as
      | Array<{ content?: { parts?: Array<{ text?: string }> } }>
      | undefined;
    const reply =
      candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() || "";

    if (!reply) {
      return { ok: false, error: "Gemini respondeu sem texto.", httpStatus: 502 };
    }

    return { ok: true, reply, model, tipo };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Falha ao contactar Gemini.",
    };
  }
}
