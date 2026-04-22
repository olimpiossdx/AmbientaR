import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { isAiLocalImportEnabled } from "@/lib/deploy-flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportedFile = {
  title: string;
  content: string;
  tags: string[];
  sourcePath: string;
  modifiedAt: string;
};

const DEFAULT_BASE_PATH =
  "F:\\SERVIDOR\\OneDrive\\Projects\\AmbientaR\\Termos de Referencia";
const MAX_FILES = 40;
const MAX_CHARS_PER_FILE = 9000;
const MAX_CANDIDATES_TO_SCAN = 1200;

function clampText(input: string, max = MAX_CHARS_PER_FILE) {
  return input.length > max ? `${input.slice(0, max)}...` : input;
}

async function walkFiles(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

async function readSafeText(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".txt", ".md", ".json", ".csv"].includes(ext)) {
    const raw = await fs.readFile(filePath, "utf-8");
    return clampText(raw.replace(/\s+/g, " ").trim());
  }

  if (ext === ".pdf") {
    try {
      const buffer = await fs.readFile(filePath);
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
      // fallback abaixo
    }
  }

  if (ext === ".docx") {
    try {
      const buffer = await fs.readFile(filePath);
      const parsed = await mammoth.extractRawText({ buffer });
      const text = (parsed.value || "").replace(/\s+/g, " ").trim();
      if (text) return clampText(text);
    } catch {
      // fallback abaixo
    }
  }

  // Fallback para formatos sem parser dedicado (ex.: .doc) ou falha de extração.
  const stat = await fs.stat(filePath);
  return clampText(
    `Arquivo de referência detectado (${ext}).\n` +
      `Nome: ${path.basename(filePath)}\n` +
      `Caminho: ${filePath}\n` +
      `Tamanho: ${stat.size} bytes.\n` +
      `Observação: sem extração textual completa para este formato.`,
  );
}

export async function POST(request: NextRequest) {
  if (!isAiLocalImportEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Importação local de referências está desativada temporariamente para estabilização do deploy.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      basePath?: string;
      extensions?: string[];
      modifiedAfter?: string;
      cpfCnpj?: string;
    };
    const basePath = (body.basePath || DEFAULT_BASE_PATH).trim();
    const allowedExtensions =
      Array.isArray(body.extensions) && body.extensions.length > 0
        ? body.extensions
            .map((ext) => ext.trim().toLowerCase())
            .filter(Boolean)
            .map((ext) => (ext.startsWith(".") ? ext : `.${ext}`))
        : null;
    const modifiedAfterDate = body.modifiedAfter
      ? new Date(body.modifiedAfter)
      : null;
    const normalizedCpfCnpj = (body.cpfCnpj || "").replace(/\D/g, "");

    const files = await walkFiles(basePath);
    const candidates = [];
    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      if (allowedExtensions && !allowedExtensions.includes(ext)) continue;
      try {
        const stat = await fs.stat(filePath);
        if (modifiedAfterDate && !Number.isNaN(modifiedAfterDate.getTime())) {
          if (stat.mtime <= modifiedAfterDate) continue;
        }
        candidates.push({ filePath, mtime: stat.mtime });
      } catch {
        // ignora arquivo com erro de stat
      }
    }

    const orderedCandidates = candidates
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, MAX_CANDIDATES_TO_SCAN);

    const importedMatches: ImportedFile[] = [];
    const importedFallback: ImportedFile[] = [];
    for (const item of orderedCandidates) {
      if (importedMatches.length >= MAX_FILES) break;
      try {
        const filePath = item.filePath;
        const content = await readSafeText(filePath);
        if (!content) continue;
        const payload = {
          title: path.basename(filePath),
          content,
          tags: [
            "termos-referencia",
            "import-automatico",
            path.extname(filePath).replace(".", ""),
          ],
          sourcePath: filePath,
          modifiedAt: item.mtime.toISOString(),
        };

        if (normalizedCpfCnpj) {
          const normalizedContent = content.replace(/\D/g, "");
          const normalizedPath = filePath.replace(/\D/g, "");
          const normalizedTitle = path.basename(filePath).replace(/\D/g, "");
          const containsCpf =
            normalizedContent.includes(normalizedCpfCnpj) ||
            normalizedPath.includes(normalizedCpfCnpj) ||
            normalizedTitle.includes(normalizedCpfCnpj);
          if (containsCpf) {
            importedMatches.push(payload);
          } else if (importedFallback.length < MAX_FILES) {
            importedFallback.push(payload);
          }
        } else if (importedFallback.length < MAX_FILES) {
          importedFallback.push(payload);
        }
      } catch {
        // ignora arquivo inválido e segue
      }
    }

    const imported = normalizedCpfCnpj
      ? [...importedMatches, ...importedFallback].slice(0, MAX_FILES)
      : importedFallback.slice(0, MAX_FILES);

    return NextResponse.json({
      success: true,
      imported,
      matchedByCpfCount: importedMatches.length,
      totalFound: files.length,
      totalEligible: candidates.length,
      totalImported: imported.length,
      appliedFilters: {
        extensions: allowedExtensions,
        cpfCnpj: normalizedCpfCnpj || null,
        modifiedAfter:
          modifiedAfterDate && !Number.isNaN(modifiedAfterDate.getTime())
            ? modifiedAfterDate.toISOString()
            : null,
      },
      limits: { maxFiles: MAX_FILES, maxCharsPerFile: MAX_CHARS_PER_FILE },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao importar arquivos de referência.",
      },
      { status: 500 },
    );
  }
}
