import type { Auth } from "firebase/auth";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import type {
  ReferenceSearchHit,
  ReferenceSearchRequest,
  ReferenceSearchResult,
} from "@/lib/reference-search/types";

const DEFAULT_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".md", ".csv"];

export async function searchReferencesLocal(
  auth: Auth | null,
  request: ReferenceSearchRequest,
): Promise<ReferenceSearchResult> {
  // Resolução de pastas (study → subpasta TR, defaults) fica no servidor — ver import-reference-files.
  const explicitBasePath = request.basePath?.trim();

  const headers = await getAdminApiRequestHeaders(auth);
  const res = await fetch("/api/ai-lab/import-reference-files", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(explicitBasePath ? { basePath: explicitBasePath } : {}),
      study: request.study?.trim() || undefined,
      extensions: request.extensions?.length
        ? request.extensions
        : DEFAULT_EXTENSIONS,
      cpfCnpj: request.cpfCnpj,
      modifiedAfter: request.modifiedAfter,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(
      data.error ||
        "Importação local desativada ou indisponível (ENABLE_AI_LOCAL_IMPORT).",
    );
  }

  const imported = Array.isArray(data.imported) ? data.imported : [];
  const hits = imported.map(
    (item: {
      title: string;
      content: string;
      sourcePath?: string;
      tags?: string[];
      modifiedAt?: string;
    }) => ({
      title: item.title,
      content: item.content,
      sourcePath: item.sourcePath || item.title,
      tags: item.tags,
      modifiedAt: item.modifiedAt,
    }),
  );

  const citations = hits.map(
    (h: ReferenceSearchHit) => `local:${h.sourcePath || h.title}`,
  );

  const contextText = hits
    .map(
      (h: ReferenceSearchHit) =>
        `[Arquivo Local] ${h.title} (${h.sourcePath})\n${(h.content || "").slice(0, 2000)}`,
    )
    .join("\n\n---\n\n");

  return {
    hits,
    citations,
    contextText,
    provider: "local",
    matchedByCpfCount: Number(data.matchedByCpfCount || 0),
  };
}
