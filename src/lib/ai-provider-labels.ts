export type AiProviderId = "gemini" | "deepseek";

export const AI_PROVIDER_META: Record<
  AiProviderId,
  { label: string; short: string; description: string; badgeClass: string }
> = {
  gemini: {
    label: "Google Gemini",
    short: "Gemini",
    description:
      "Consultas curtas e rascunhos — custo baixo (modelo Flash). Ideal para o dia a dia.",
    badgeClass:
      "border-blue-500/40 bg-blue-500/10 text-blue-900 dark:text-blue-100",
  },
  deepseek: {
    label: "DeepSeek",
    short: "DeepSeek",
    description:
      "Relatórios longos, análise de mapa e sínteses grandes — uso pago na sua conta DeepSeek.",
    badgeClass:
      "border-violet-500/40 bg-violet-500/10 text-violet-900 dark:text-violet-100",
  },
};

export function normalizeProviderId(
  raw: string | undefined | null,
): AiProviderId | null {
  if (raw === "gemini" || raw === "deepseek") return raw;
  return null;
}

export function providerLabel(raw: string | undefined | null): string {
  const id = normalizeProviderId(raw);
  if (!id) return "IA";
  return AI_PROVIDER_META[id].short;
}
