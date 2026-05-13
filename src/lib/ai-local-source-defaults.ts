/**
 * Caminho base sugerido para referências da IA (pasta local).
 * Definir em `.env.local`: `NEXT_PUBLIC_AI_REFERENCE_FILES_PATH` (opcional).
 * No servidor, `AI_REFERENCE_FILES_PATH` tem prioridade — ver `ai-reference-import-base-path.ts`.
 */
export const DEFAULT_AI_LOCAL_SOURCE_PATH =
  process.env.NEXT_PUBLIC_AI_REFERENCE_FILES_PATH?.trim() ?? "";
