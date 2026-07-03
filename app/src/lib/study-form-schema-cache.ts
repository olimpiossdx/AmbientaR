import path from 'path';
import { promises as fs } from 'fs';
import type { StudyFormSchema } from '@/lib/study-form-schema';
import { extractDocxStructure } from '@/lib/docx-extract-structure';
import { resolveTermReferenceBaseFile } from '@/lib/termos-referencia-doc-resolver';
import { extractListagemCode } from '@/lib/listagem-activities';
import { enhanceStudyFormSchema } from '@/lib/study-form-schema-enhance';

export const FORM_SCHEMA_CACHE_FILE = '.form-schema-cache.json';

export type SchemaCacheEntry = {
  key: string;
  fileRelativePath: string;
  fileMtimeMs: number;
  schema: StudyFormSchema;
  matchedBy: {
    listagemCode: string | null;
    subactivity: string | null;
    file: string;
    strategy: string;
  };
  updatedAt: string;
};

export type SchemaCacheFile = {
  version: 1;
  entries: Record<string, SchemaCacheEntry>;
};

export function buildSchemaCacheKey(params: {
  studySlug: string;
  listagemCode: string | null;
  subactivity: string | null;
  relativePath: string;
}): string {
  const sub = (params.subactivity || '').trim().toLowerCase();
  return [
    params.studySlug.trim().toLowerCase(),
    params.listagemCode || '-',
    sub || '-',
    params.relativePath.trim().toLowerCase(),
  ].join('|');
}

export async function readSchemaCacheFile(dirPath: string): Promise<SchemaCacheFile> {
  const cacheFilePath = path.join(dirPath, FORM_SCHEMA_CACHE_FILE);
  try {
    const raw = await fs.readFile(cacheFilePath, 'utf-8');
    const parsed = JSON.parse(raw) as SchemaCacheFile;
    if (parsed?.version === 1 && parsed.entries && typeof parsed.entries === 'object') {
      return parsed;
    }
  } catch {
    // cache ausente ou inválido
  }
  return { version: 1, entries: {} };
}

export async function writeSchemaCacheFile(
  dirPath: string,
  payload: SchemaCacheFile,
): Promise<void> {
  const cacheFilePath = path.join(dirPath, FORM_SCHEMA_CACHE_FILE);
  await fs.writeFile(cacheFilePath, JSON.stringify(payload, null, 2), 'utf-8');
}

export function structureToSchema(
  studySlug: string,
  sourceFile: string,
  structure: { placeholders: string[]; headings: { level: number; text: string }[] },
): StudyFormSchema {
  const sections: StudyFormSchema['sections'] = [];
  const seenPlaceholders = new Set<string>();

  for (const h of structure.headings) {
    sections.push({
      id:
        h.text
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 40) || `section_${sections.length}`,
      title: h.text,
      fields: [],
    });
  }

  for (const ph of structure.placeholders) {
    const normalized = ph.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    if (!normalized || seenPlaceholders.has(normalized)) continue;
    seenPlaceholders.add(normalized);
    const sectionId = sections.length ? sections[sections.length - 1].id : 'dados';
    let sec = sections.find((s) => s.id === sectionId);
    if (!sec) {
      sec = { id: 'dados', title: 'Dados', fields: [] };
      sections.push(sec);
    }
    if (!sec.fields) sec.fields = [];
    sec.fields.push({
      id: normalized,
      label: ph,
      type: 'string',
      required: false,
    });
  }

  if (sections.length === 0 && structure.placeholders.length > 0) {
    sections.push({
      id: 'dados',
      title: 'Dados',
      fields: structure.placeholders.slice(0, 50).map((ph) => ({
        id: ph.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''),
        label: ph,
        type: 'string' as const,
        required: false,
      })),
    });
  }

  return {
    version: '1.0',
    studySlug,
    sourceFile,
    processedAt: new Date().toISOString(),
    sections,
  };
}

export type ResolveSchemaParams = {
  studySlug: string;
  dirPath: string;
  listagemCode?: string | null;
  activity?: string | null;
  subactivity?: string | null;
  refresh?: boolean;
  /** Não grava `.form-schema-cache.json` (útil em jobs dry-run). */
  dryRun?: boolean;
};

export type ResolveSchemaResult =
  | {
      ok: true;
      schema: StudyFormSchema;
      source: 'cache' | 'docx';
      matchedBy: SchemaCacheEntry['matchedBy'];
      cacheKey: string;
      skippedCacheWrite?: boolean;
    }
  | { ok: false; reason: string };

export async function resolveAndCacheStudyFormSchema(
  params: ResolveSchemaParams,
): Promise<ResolveSchemaResult> {
  const listagemFromActivity = extractListagemCode(params.activity ?? params.listagemCode);
  const resolvedListagemCode = listagemFromActivity ?? params.listagemCode ?? null;

  const resolved = await resolveTermReferenceBaseFile({
    rootDirPath: params.dirPath,
    studySlug: params.studySlug,
    listagemCode: resolvedListagemCode,
    subactivity: params.subactivity ?? null,
  });

  if (!resolved) {
    return { ok: false, reason: 'Nenhum arquivo .dotx/.docx encontrado na pasta vinculada.' };
  }

  const fileStat = await fs.stat(resolved.filePath);
  const cacheKey = buildSchemaCacheKey({
    studySlug: params.studySlug,
    listagemCode: resolvedListagemCode,
    subactivity: params.subactivity ?? null,
    relativePath: resolved.relativePath,
  });

  const cacheFile = await readSchemaCacheFile(params.dirPath);
  const cached = cacheFile.entries[cacheKey];
  const enhanceCtx = {
    studySlug: params.studySlug,
    listagemCode: resolvedListagemCode,
    activity: params.activity ?? null,
    subactivity: params.subactivity ?? null,
  };

  if (!params.refresh && cached && cached.fileMtimeMs === fileStat.mtimeMs) {
    return {
      ok: true,
      schema: enhanceStudyFormSchema(cached.schema, enhanceCtx),
      source: 'cache',
      matchedBy: cached.matchedBy,
      cacheKey,
    };
  }

  const structure = await extractDocxStructure(resolved.filePath);
  const rawSchema = structureToSchema(
    params.studySlug,
    resolved.relativePath,
    structure,
  );
  const schema = enhanceStudyFormSchema(rawSchema, enhanceCtx);
  const matchedBy = {
    listagemCode: resolvedListagemCode,
    subactivity: params.subactivity ?? null,
    file: resolved.relativePath,
    strategy: resolved.reason,
  };

  if (!params.dryRun) {
    cacheFile.entries[cacheKey] = {
      key: cacheKey,
      fileRelativePath: resolved.relativePath,
      fileMtimeMs: fileStat.mtimeMs,
      schema,
      matchedBy,
      updatedAt: new Date().toISOString(),
    };
    await writeSchemaCacheFile(params.dirPath, cacheFile);
  }

  return {
    ok: true,
    schema,
    source: 'docx',
    matchedBy,
    cacheKey,
    skippedCacheWrite: params.dryRun,
  };
}
