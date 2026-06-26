import type { Auth } from "firebase/auth";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import type {
  ReferenceSearchHit,
  ReferenceSearchRequest,
  ReferenceSearchResult,
} from "@/lib/reference-search/types";

export async function searchReferencesCloud(
  auth: Auth | null,
  request: ReferenceSearchRequest,
): Promise<ReferenceSearchResult> {
  const headers = await getAdminApiRequestHeaders(auth);
  const res = await fetch("/api/cloud-rag/search", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: request.query,
      pathPrefix: request.pathPrefix,
      cpfCnpj: request.cpfCnpj,
      extensions: request.extensions,
      modifiedAfter: request.modifiedAfter,
      maxChunks: request.maxResults ?? 15,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Falha na pesquisa na biblioteca OneDrive.");
  }

  const chunks = Array.isArray(data.chunks) ? data.chunks : [];
  const digits = (request.cpfCnpj || "").replace(/\D/g, "");

  const hits = chunks.map(
    (c: {
      chunkText: string;
      path: string;
      fileName: string;
      score?: number;
    }) => ({
      title: c.fileName,
      content: c.chunkText,
      sourcePath: c.path,
      tags: ["onedrive", "cloud-rag"],
      score: c.score,
    }),
  );

  let matchedByCpfCount = 0;
  if (digits) {
    matchedByCpfCount = hits.filter((h: ReferenceSearchHit) => {
      const blob = `${h.content}${h.sourcePath}${h.title}`.replace(/\D/g, "");
      return blob.includes(digits);
    }).length;
  }

  return {
    hits,
    citations: Array.isArray(data.citations) ? data.citations : [],
    contextText: data.contextText || "",
    provider: "cloud",
    matchedByCpfCount,
  };
}
