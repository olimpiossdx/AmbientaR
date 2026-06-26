import { adminDb } from "@/lib/firebase-admin";
import { tokenizeForKeywords } from "@/lib/cloud-rag/chunker";
import type {
  CloudRagChunk,
  CloudRagSearchHit,
  CloudRagSearchOptions,
} from "@/lib/cloud-rag/types";
import { CLOUD_RAG_CHUNKS } from "@/lib/cloud-rag/types";

const DEFAULT_MAX = 15;
const SCAN_LIMIT = 400;

function normalizeDigits(input: string): string {
  return input.replace(/\D/g, "");
}

function scoreChunk(
  chunk: CloudRagChunk,
  tokens: string[],
  digits: string,
): number {
  const hay = `${chunk.chunkText} ${chunk.path} ${chunk.fileName}`.toLowerCase();
  const hayDigits = hay.replace(/\D/g, "");
  let score = 0;
  for (const token of tokens) {
    if (hay.includes(token)) score += 2;
  }
  if (digits && hayDigits.includes(digits)) score += 10;
  if (digits && chunk.path.replace(/\D/g, "").includes(digits)) score += 6;
  return score;
}

export async function searchCloudRag(
  options: CloudRagSearchOptions,
): Promise<{ chunks: CloudRagSearchHit[]; citations: string[] }> {
  const maxChunks = options.maxChunks ?? DEFAULT_MAX;
  const pathPrefix = options.pathPrefix?.trim().replace(/\\/g, "/");
  const query = options.query?.trim() || "";
  const digits = options.cpfCnpj
    ? normalizeDigits(options.cpfCnpj)
    : normalizeDigits(query);

  const tokens = tokenizeForKeywords(query, 12);

  const col = adminDb().collection(CLOUD_RAG_CHUNKS);
  const snap = pathPrefix
    ? await col
        .where("path", ">=", pathPrefix)
        .where("path", "<=", pathPrefix + "\uf8ff")
        .limit(SCAN_LIMIT)
        .get()
    : await col.limit(SCAN_LIMIT).get();
  let candidates = snap.docs.map((d) => d.data() as CloudRagChunk);

  if (options.extensions?.length) {
    const allowed = new Set(
      options.extensions.map((e) =>
        e.startsWith(".") ? e.toLowerCase() : `.${e.toLowerCase()}`,
      ),
    );
    candidates = candidates.filter(
      (c) => c.extension && allowed.has(c.extension),
    );
  }

  if (options.modifiedAfter) {
    const after = new Date(options.modifiedAfter).getTime();
    if (!Number.isNaN(after)) {
      candidates = candidates.filter((c) => {
        const t = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
        return t >= after;
      });
    }
  }

  if (!query && !digits) {
    return { chunks: [], citations: [] };
  }

  const scored = candidates
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, tokens, digits),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);

  const hits: CloudRagSearchHit[] = scored.map(({ chunk, score }) => ({
    chunkText: chunk.chunkText,
    path: chunk.path,
    fileName: chunk.fileName,
    itemId: chunk.itemId,
    fileId: chunk.fileId,
    score,
  }));

  const citations = hits.map(
    (h, i) =>
      `[${i + 1}] ${h.fileName} — ${h.path} (OneDrive)`,
  );

  return { chunks: hits, citations };
}

export function formatCloudRagHitsForPrompt(
  hits: CloudRagSearchHit[],
): string {
  if (hits.length === 0) return "";
  return hits
    .map(
      (h, i) =>
        `[${i + 1}] ${h.fileName} (${h.path})\n${h.chunkText.slice(0, 2000)}`,
    )
    .join("\n\n---\n\n");
}
