import path from "node:path";
import { DEFAULT_AI_LOCAL_SOURCE_PATH } from "@/lib/ai-local-source-defaults";

/**
 * Base usada pela rota `POST /api/ai-lab/import-reference-files` quando o body não envia `basePath`.
 * Ordem: `AI_REFERENCE_FILES_PATH` → `NEXT_PUBLIC_AI_REFERENCE_FILES_PATH` → `termos de referencia/` na raiz do projeto.
 */
export function getDefaultAiReferenceImportBasePath(): string {
  const serverOnly = process.env.AI_REFERENCE_FILES_PATH?.trim();
  if (serverOnly) return serverOnly;
  if (DEFAULT_AI_LOCAL_SOURCE_PATH) return DEFAULT_AI_LOCAL_SOURCE_PATH;
  return path.join(process.cwd(), "termos de referencia");
}
