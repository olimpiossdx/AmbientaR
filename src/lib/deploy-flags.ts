/**
 * Flags para estabilizar o deploy em produção.
 * Padrão: recursos sensíveis (IA/webhook/import local) desativados.
 */
function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isAiRoutesEnabled(): boolean {
  return parseBooleanEnv(process.env.ENABLE_AI_ROUTES, false);
}

export function isAiLocalImportEnabled(): boolean {
  return parseBooleanEnv(process.env.ENABLE_AI_LOCAL_IMPORT, false);
}

export function isLaudoWebhookEnabled(): boolean {
  return parseBooleanEnv(process.env.ENABLE_LAUDO_WEBHOOK, false);
}

export function isDebugAgentIngestEnabled(): boolean {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_ENABLE_AGENT_INGEST_DEBUG, false);
}
