/**
 * Extração de JSON em respostas de modelos (DeepSeek / Gemini).
 */

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("A resposta da IA não contém JSON válido.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}
