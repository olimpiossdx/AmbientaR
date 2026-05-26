import { getChunkChars } from "@/lib/cloud-rag/config";
import { chunkDocId } from "@/lib/cloud-rag/path-utils";
import type { CloudRagChunk, CloudRagFile } from "@/lib/cloud-rag/types";

const STOPWORDS = new Set([
  "para",
  "com",
  "uma",
  "dos",
  "das",
  "que",
  "por",
  "sem",
  "nos",
  "nas",
  "the",
  "and",
]);

export function tokenizeForKeywords(text: string, max = 40): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  return [...new Set(tokens)].slice(0, max);
}

export function chunkFileText(
  file: CloudRagFile,
  rawText: string,
): CloudRagChunk[] {
  const size = getChunkChars();
  const chunks: CloudRagChunk[] = [];
  let offset = 0;
  let index = 0;

  while (offset < rawText.length) {
    const slice = rawText.slice(offset, offset + size).trim();
    if (slice) {
      const id = chunkDocId(file.id, index);
      chunks.push({
        id,
        fileId: file.id,
        chunkIndex: index,
        chunkText: slice,
        path: file.path,
        fileName: file.name,
        itemId: file.itemId,
        driveId: file.driveId,
        extension: file.extension,
        clientHint: file.clientHint,
        keywords: tokenizeForKeywords(`${file.name} ${file.path} ${slice}`),
        updatedAt: new Date().toISOString(),
      });
      index += 1;
    }
    offset += size;
  }

  return chunks;
}
