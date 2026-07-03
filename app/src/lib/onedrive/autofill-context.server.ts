import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import {
  buildCpfCnpjVariants,
  normalizeDocumentDigits,
} from "@/lib/document-lookup";
import { downloadDriveItemContent } from "@/lib/cloud-rag/content-download";
import { INDEXABLE_EXTENSIONS } from "@/lib/cloud-rag/config";
import { extensionFromName } from "@/lib/cloud-rag/path-utils";
import { extractTextFromBuffer } from "@/lib/cloud-rag/extract/text-from-buffer";
import {
  formatCloudRagHitsForPrompt,
  searchCloudRag,
} from "@/lib/cloud-rag/search";
import { isCloudRagSearchEnabled } from "@/lib/cloud-rag/deploy-flags";
import {
  getActiveFolderLinkByClientId,
  getSyncSource,
  listActiveFolderLinks,
  listCatalogForClient,
} from "@/lib/onedrive/catalog-store";
import {
  getDriveItemByPath,
  getDriveItemByPathForMode,
  getGraphAuthMode,
  listDriveChildren,
  listDriveChildrenForMode,
  resolveDefaultDriveIdForMode,
} from "@/lib/onedrive/graph";
import { ensureProjectsSyncSource } from "@/lib/onedrive/sync-delta";
import type { Client, Empreendedor } from "@/lib/types";
import type { ClientFolderLink, OnedriveCatalogEntry } from "@/lib/onedrive/types";
import { normalizeOnedriveFolderPath } from "@/lib/onedrive/path-utils";

const AUTOFILL_MAX_FILES = Math.max(
  1,
  Math.min(12, Number(process.env.ONEDRIVE_AUTOFILL_MAX_FILES || 8)),
);

const GRAPH_WALK_MAX_DEPTH = 4;
const GRAPH_WALK_MAX_FILES = 60;

const KEYWORD_BOOST = [
  "cadastro",
  "cpf",
  "cnpj",
  "rg",
  "identidade",
  "endereco",
  "endereço",
  "comprovante",
  "ficha",
  "requerente",
  "cliente",
];

export type OnedriveAutofillContextResult = {
  clientId: string | null;
  clientName: string | null;
  folderPath: string | null;
  folderLinked: boolean;
  catalogFileCount: number;
  ragChunkCount: number;
  extractedFileCount: number;
  evidenceText: string;
  citations: string[];
  hints: string[];
  diagnostics?: string;
};

type FileRef = { itemId: string; name: string; path: string };

function normalizeNameForMatch(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function findClientByCpfAdmin(
  cpfDigits: string,
): Promise<(Partial<Client> & { id: string }) | null> {
  const variants = buildCpfCnpjVariants(cpfDigits).slice(0, 10);
  if (variants.length === 0) return null;

  const snap = await adminDb()
    .collection("clients")
    .where("cpfCnpj", "in", variants)
    .limit(10)
    .get();

  const target = normalizeDocumentDigits(cpfDigits);
  const rows = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Partial<Client>),
  }));

  return (
    rows.find((c) => normalizeDocumentDigits(c.cpfCnpj) === target) ??
    rows[0] ??
    null
  );
}

async function findEmpreendedorByCpfAdmin(
  cpfDigits: string,
): Promise<(Partial<Empreendedor> & { id: string }) | null> {
  const variants = buildCpfCnpjVariants(cpfDigits).slice(0, 10);
  if (variants.length === 0) return null;

  const snap = await adminDb()
    .collection("empreendedores")
    .where("cpfCnpj", "in", variants)
    .limit(10)
    .get();

  const target = normalizeDocumentDigits(cpfDigits);
  const rows = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Partial<Empreendedor>),
  }));

  return (
    rows.find((e) => normalizeDocumentDigits(e.cpfCnpj) === target) ??
    rows[0] ??
    null
  );
}

function folderPathMatchesName(folderPath: string, personName: string): boolean {
  const pathNorm = normalizeNameForMatch(folderPath);
  const nameNorm = normalizeNameForMatch(personName);
  if (!pathNorm || !nameNorm) return false;
  if (pathNorm.includes(nameNorm)) return true;
  const tokens = nameNorm.split(" ").filter((t) => t.length > 2);
  if (tokens.length < 2) return pathNorm.includes(tokens[0] || "");
  const hits = tokens.filter((t) => pathNorm.includes(t));
  return hits.length >= Math.min(2, tokens.length);
}

async function resolveClientAndFolderLink(cpfDigits: string): Promise<{
  client: (Partial<Client> & { id: string }) | null;
  link: ClientFolderLink | null;
  hints: string[];
  diagnostics: string[];
}> {
  const hints: string[] = [];
  const diagnostics: string[] = [];

  const client = await findClientByCpfAdmin(cpfDigits);
  if (client) {
    diagnostics.push(`cliente Firestore: ${client.id}`);
    const link = await getActiveFolderLinkByClientId(client.id);
    if (link) {
      diagnostics.push(`vínculo direto: ${link.oneDrivePath}`);
      return { client, link, hints, diagnostics };
    }
    hints.push(
      `Cliente «${client.name || client.id}» existe, mas não tem pasta OneDrive vinculada (status active).`,
    );
  } else {
    diagnostics.push("sem cliente com este CPF em clients/");
  }

  const activeLinks = await listActiveFolderLinks(80);
  diagnostics.push(`${activeLinks.length} pasta(s) ativa(s) em client_folder_links`);

  for (const link of activeLinks) {
    const cs = await adminDb().collection("clients").doc(link.clientId).get();
    if (!cs.exists) continue;
    const data = cs.data() as Partial<Client>;
    if (normalizeDocumentDigits(data.cpfCnpj) === cpfDigits) {
      diagnostics.push(`vínculo por scan CPF: ${link.oneDrivePath}`);
      return {
        client: { id: cs.id, ...data },
        link,
        hints,
        diagnostics,
      };
    }
  }

  const empreendedor = await findEmpreendedorByCpfAdmin(cpfDigits);
  if (empreendedor?.name) {
    diagnostics.push(`empreendedor: ${empreendedor.name}`);
    for (const link of activeLinks) {
      if (folderPathMatchesName(link.oneDrivePath, empreendedor.name)) {
        hints.push(
          `Pasta encontrada pelo nome «${empreendedor.name}» (vínculo em ${link.clientId}).`,
        );
        let linkedClient: (Partial<Client> & { id: string }) | null = client;
        const cs = await adminDb().collection("clients").doc(link.clientId).get();
        if (cs.exists) {
          linkedClient = { id: cs.id, ...(cs.data() as Partial<Client>) };
        }
        diagnostics.push(`match nome → ${link.oneDrivePath}`);
        return {
          client: linkedClient,
          link,
          hints,
          diagnostics,
        };
      }
    }
  }

  const pilotCpf = normalizeDocumentDigits(
    process.env.ONEDRIVE_PILOT_CPF || "",
  );
  const pilotPath = process.env.ONEDRIVE_PILOT_FOLDER_PATH?.trim();
  if (pilotCpf === cpfDigits && pilotPath) {
    try {
      const authMode = getGraphAuthMode();
      const normalized = normalizeOnedriveFolderPath(pilotPath);
      let driveId: string;
      let syncSourceId = "env-pilot";
      if (authMode === "delegated") {
        const resolved = await resolveDefaultDriveIdForMode(authMode);
        driveId = resolved.driveId;
        syncSourceId = "delegated-primary";
      } else {
        const { source } = await ensureProjectsSyncSource();
        if (!source?.driveId) throw new Error("Sem driveId");
        driveId = source.driveId;
        syncSourceId = source.id;
      }
      const folderItem = await getDriveItemByPathForMode(
        authMode,
        driveId,
        normalized,
      );
      if (!folderItem.id) throw new Error("Pasta piloto sem id");
      const link: ClientFolderLink = {
        id: "env-pilot",
        clientId: client?.id || "",
        syncSourceId,
        oneDriveItemId: folderItem.id,
        oneDrivePath: normalized,
        linkMethod: "admin_manual",
        status: "active",
        portalAccess: "readonly",
        syncEnabled: true,
      };
      hints.push("Usando pasta piloto definida no .env (ONEDRIVE_PILOT_*).");
      diagnostics.push(`piloto .env: ${normalized}`);
      return { client, link, hints, diagnostics };
    } catch (err) {
      hints.push(
        `Pasta piloto no .env não acessível: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (!client && !empreendedor) {
    hints.push(
      "Nenhum cliente/empreendedor com este CPF no Firestore. Cadastre o cliente ou vincule a pasta em Configurações → Integração OneDrive.",
    );
  } else if (activeLinks.length === 0) {
    hints.push(
      "Nenhuma pasta de cliente vinculada no sistema. Abra Integração OneDrive e vincule a pasta do Luciano.",
    );
  }

  return { client, link: null, hints, diagnostics };
}

function scoreFileRef(ref: FileRef, cpfDigits: string): number {
  const blob = `${ref.path} ${ref.name}`.toLowerCase();
  const blobDigits = blob.replace(/\D/g, "");
  let score = 0;
  if (cpfDigits && blobDigits.includes(cpfDigits)) score += 25;
  for (const kw of KEYWORD_BOOST) {
    if (blob.includes(kw)) score += 4;
  }
  const ext = extensionFromName(ref.name);
  if (ext === ".pdf" || ext === ".docx") score += 3;
  return score;
}

async function extractTextFromFileRefs(
  driveId: string,
  refs: FileRef[],
  cpfDigits: string,
): Promise<{ text: string; citations: string[]; count: number }> {
  const candidates = refs
    .filter((r) => INDEXABLE_EXTENSIONS.has(extensionFromName(r.name)))
    .sort((a, b) => scoreFileRef(b, cpfDigits) - scoreFileRef(a, cpfDigits))
    .slice(0, AUTOFILL_MAX_FILES);

  const parts: string[] = [];
  const citations: string[] = [];
  let count = 0;

  for (const file of candidates) {
    try {
      const buffer = await downloadDriveItemContent(driveId, file.itemId);
      const text = await extractTextFromBuffer(buffer, file.name);
      if (!text || text.length < 30) continue;
      count += 1;
      citations.push(`onedrive:${file.path}`);
      parts.push(
        `[OneDrive] ${file.name} (${file.path})\n${text.slice(0, 6000)}`,
      );
    } catch {
      // ignora ficheiro problemático
    }
  }

  return {
    text: parts.join("\n\n---\n\n"),
    citations,
    count,
  };
}

function catalogToFileRefs(entries: OnedriveCatalogEntry[]): FileRef[] {
  return entries
    .filter((e) => !e.isFolder && !e.deleted)
    .map((e) => ({
      itemId: e.itemId,
      name: e.name,
      path: e.path,
    }));
}

/** Lista ficheiros na pasta via Graph (quando o catálogo Firestore ainda está vazio). */
async function collectFilesFromGraphFolder(
  driveId: string,
  folderItemId: string,
  folderPath: string,
): Promise<FileRef[]> {
  const out: FileRef[] = [];
  const base = folderPath.replace(/\/+$/, "");

  async function walk(itemId: string, prefix: string, depth: number) {
    if (depth > GRAPH_WALK_MAX_DEPTH || out.length >= GRAPH_WALK_MAX_FILES) {
      return;
    }
    let children;
    try {
      const mode = getGraphAuthMode();
      children = await listDriveChildrenForMode(mode, driveId, itemId);
    } catch {
      return;
    }
    for (const child of children) {
      if (!child.id || !child.name) continue;
      const childPath = `${prefix}/${child.name}`;
      if (child.folder) {
        await walk(child.id, childPath, depth + 1);
      } else if (
        INDEXABLE_EXTENSIONS.has(extensionFromName(child.name))
      ) {
        out.push({ itemId: child.id, name: child.name, path: childPath });
      }
    }
  }

  await walk(folderItemId, base, 0);
  return out;
}

/**
 * Monta evidências textuais da pasta OneDrive vinculada ao cliente (CPF).
 */
export async function buildOnedriveAutofillContext(
  cpfCnpj: string,
): Promise<OnedriveAutofillContextResult> {
  const cpfDigits = normalizeDocumentDigits(cpfCnpj);
  const hints: string[] = [];

  if (cpfDigits.length < 11) {
    return {
      clientId: null,
      clientName: null,
      folderPath: null,
      folderLinked: false,
      catalogFileCount: 0,
      ragChunkCount: 0,
      extractedFileCount: 0,
      evidenceText: "",
      citations: [],
      hints: ["CPF/CNPJ inválido para busca na pasta OneDrive."],
    };
  }

  const resolved = await resolveClientAndFolderLink(cpfDigits);
  hints.push(...resolved.hints);

  if (!resolved.link) {
    return {
      clientId: resolved.client?.id || null,
      clientName: resolved.client?.name || null,
      folderPath: null,
      folderLinked: false,
      catalogFileCount: 0,
      ragChunkCount: 0,
      extractedFileCount: 0,
      evidenceText: "",
      citations: [],
      hints,
      diagnostics: resolved.diagnostics.join(" · "),
    };
  }

  const link = resolved.link;
  const folderPath = link.oneDrivePath;
  const clientId = resolved.client?.id || link.clientId || null;

  let catalog: OnedriveCatalogEntry[] = [];
  if (clientId) {
    catalog = await listCatalogForClient(clientId, { limit: 800 });
  }
  let fileRefs = catalogToFileRefs(catalog);

  const authMode = getGraphAuthMode();
  let driveId: string | undefined;
  if (authMode === "delegated") {
    driveId = (await resolveDefaultDriveIdForMode(authMode)).driveId;
  } else {
    const source =
      (await getSyncSource(link.syncSourceId)) ||
      (await ensureProjectsSyncSource()).source;
    driveId = source?.driveId;
  }

  if (fileRefs.length === 0 && driveId && link.oneDriveItemId) {
    hints.push(
      "Catálogo vazio — a ler ficheiros diretamente no OneDrive (Graph).",
    );
    try {
      fileRefs = await collectFilesFromGraphFolder(
        driveId,
        link.oneDriveItemId,
        folderPath,
      );
    } catch (err) {
      hints.push(
        `Não foi possível listar a pasta no Graph: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const citations: string[] = [`onedrive-folder:${folderPath}`];
  const evidenceParts: string[] = [];
  let ragChunkCount = 0;
  let extractedFileCount = 0;

  if (isCloudRagSearchEnabled()) {
    try {
      const { chunks, citations: ragCitations } = await searchCloudRag({
        cpfCnpj: cpfDigits,
        pathPrefix: folderPath,
        maxChunks: 12,
      });
      ragChunkCount = chunks.length;
      if (chunks.length > 0) {
        evidenceParts.push(formatCloudRagHitsForPrompt(chunks));
        citations.push(...ragCitations);
      }
    } catch {
      hints.push("Índice RAG indisponível; usando leitura direta dos ficheiros.");
    }
  }

  if (driveId && fileRefs.length > 0) {
    const extracted = await extractTextFromFileRefs(
      driveId,
      fileRefs,
      cpfDigits,
    );
    extractedFileCount = extracted.count;
    if (extracted.text) {
      evidenceParts.push(extracted.text);
      citations.push(...extracted.citations);
    }
  }

  if (fileRefs.length === 0) {
    hints.push(
      "Nenhum ficheiro encontrado na pasta. Confirme o vínculo e o caminho em Integração OneDrive.",
    );
  } else if (!evidenceParts.length) {
    hints.push(
      "Ficheiros encontrados, mas sem texto extraível (.pdf/.docx legíveis).",
    );
  }

  return {
    clientId,
    clientName: resolved.client?.name || null,
    folderPath,
    folderLinked: true,
    catalogFileCount: fileRefs.length,
    ragChunkCount,
    extractedFileCount,
    evidenceText: evidenceParts.join("\n\n===\n\n"),
    citations,
    hints,
    diagnostics: resolved.diagnostics.join(" · "),
  };
}
