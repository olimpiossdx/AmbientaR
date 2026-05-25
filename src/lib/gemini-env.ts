/**
 * Chave Gemini (Google AI Studio) — só servidor.
 * Use GOOGLE_GENAI_API_KEY ou GEMINI_API_KEY em `.env.local`.
 */

export function getGeminiApiKey(): string | undefined {
  const k =
    process.env.GOOGLE_GENAI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim();
  return k && k.length > 0 ? k : undefined;
}

export function requireGeminiApiKey(): string {
  const k = getGeminiApiKey();
  if (!k) {
    throw new Error(
      "GOOGLE_GENAI_API_KEY (ou GEMINI_API_KEY) não definida. Adicione em `.env.local` e reinicie o servidor.",
    );
  }
  return k;
}

export function hasGeminiApiKey(): boolean {
  return !!getGeminiApiKey();
}
