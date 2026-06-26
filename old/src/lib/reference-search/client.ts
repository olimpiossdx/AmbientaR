import type { Auth } from "firebase/auth";
import type {
  ReferenceSearchRequest,
  ReferenceSearchResult,
} from "@/lib/reference-search/types";

/**
 * Pesquisa de referências para componentes cliente (sem importar módulos `server-only`).
 */
export async function searchReferences(
  auth: Auth | null,
  request: ReferenceSearchRequest,
  options?: { preferCloud?: boolean },
): Promise<ReferenceSearchResult> {
  const preferCloud =
    options?.preferCloud ??
    process.env.NEXT_PUBLIC_ONEDRIVE_RAG_SEARCH_ENABLED !== "false";

  if (preferCloud) {
    try {
      const { searchReferencesCloud } = await import(
        "@/lib/reference-search/cloud-provider"
      );
      return await searchReferencesCloud(auth, request);
    } catch (cloudErr) {
      const message =
        cloudErr instanceof Error ? cloudErr.message : String(cloudErr);
      if (
        message.includes("desativada") ||
        message.includes("503") ||
        message.includes("Graph") ||
        message.includes("Falha na pesquisa")
      ) {
        const { searchReferencesLocal } = await import(
          "@/lib/reference-search/local-provider"
        );
        return searchReferencesLocal(auth, request);
      }
      throw cloudErr;
    }
  }

  const { searchReferencesLocal } = await import(
    "@/lib/reference-search/local-provider"
  );
  return searchReferencesLocal(auth, request);
}

export type {
  ReferenceSearchHit,
  ReferenceSearchRequest,
  ReferenceSearchResult,
} from "@/lib/reference-search/types";
