import mammoth from "mammoth";
import { getMaxRawTextChars } from "@/lib/cloud-rag/config";
import { extensionFromName } from "@/lib/cloud-rag/path-utils";

function clampText(input: string, max = getMaxRawTextChars()): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  return normalized.length > max
    ? `${normalized.slice(0, max)}...`
    : normalized;
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
): Promise<string> {
  const ext = extensionFromName(fileName);

  if ([".txt", ".md", ".json", ".csv"].includes(ext)) {
    return clampText(buffer.toString("utf-8"));
  }

  if (ext === ".pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const { text: raw } = await parser.getText();
        const text = (raw || "").replace(/\s+/g, " ").trim();
        if (text) return clampText(text);
      } finally {
        await parser.destroy();
      }
    } catch {
      // fallback
    }
  }

  if (ext === ".docx") {
    try {
      const parsed = await mammoth.extractRawText({ buffer });
      const text = (parsed.value || "").replace(/\s+/g, " ").trim();
      if (text) return clampText(text);
    } catch {
      // fallback
    }
  }

  return clampText(
    `Arquivo de referência (${ext || "sem extensão"}).\n` +
      `Nome: ${fileName}\n` +
      `Tamanho: ${buffer.length} bytes.\n` +
      `Observação: extração textual limitada para este formato.`,
  );
}
