import { promises as fs } from 'fs';
import path from 'path';
import {
  getListagemCatalogAliases,
  getStudyCatalogAliases,
} from '@/lib/study-form-resolution-catalog';

type ResolveInput = {
  rootDirPath: string;
  studySlug: string;
  listagemCode?: string | null;
  subactivity?: string | null;
};

export type ResolvedDocBaseFile = {
  filePath: string;
  relativePath: string;
  extension: '.dotx' | '.docx';
  score: number;
  reason: string;
};

type Candidate = {
  filePath: string;
  relativePath: string;
  extension: '.dotx' | '.docx';
  normalizedPath: string;
  sizeBytes: number;
};

function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(input?: string | null): string[] {
  if (!input) return [];
  return normalizeText(input)
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function extractListagemCode(value?: string | null): string | null {
  if (!value) return null;
  const raw = normalizeText(value);
  const match = raw.match(/\blistagem\s+([a-h])\b/i);
  if (match?.[1]) return match[1].toUpperCase();
  const direct = raw.match(/\b([a-h])\b/i);
  return direct?.[1] ? direct[1].toUpperCase() : null;
}

function getStudyAliases(studySlug: string): string[] {
  const normalized = normalizeText(studySlug).replace(/\s+/g, '-');
  return getStudyCatalogAliases(normalized);
}

async function collectCandidates(rootDirPath: string): Promise<Candidate[]> {
  const out: Candidate[] = [];
  async function walk(currentDir: string, relativePrefix: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(currentDir, entry.name);
      const rel = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(full, rel);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (ext !== '.dotx' && ext !== '.docx') continue;
      let sizeBytes = 0;
      try {
        const stat = await fs.stat(full);
        sizeBytes = stat.size;
      } catch {
        sizeBytes = 0;
      }
      out.push({
        filePath: full,
        relativePath: rel,
        extension: ext,
        normalizedPath: normalizeText(rel),
        sizeBytes,
      });
    }
  }

  await walk(rootDirPath, '');
  return out;
}

export async function resolveTermReferenceBaseFile(
  input: ResolveInput
): Promise<ResolvedDocBaseFile | null> {
  const listagem = extractListagemCode(input.listagemCode);
  const studyAliases = getStudyAliases(input.studySlug);
  const listagemAliases = getListagemCatalogAliases(input.studySlug, listagem);
  const subactivityTokens = tokenize(input.subactivity);
  const candidates = await collectCandidates(input.rootDirPath);
  if (candidates.length === 0) return null;

  const scored = candidates.map((c) => {
    let score = 0;
    const reasons: string[] = [];

    if (c.extension === '.dotx') {
      score += 40;
      reasons.push('preferencia DOTX');
    } else {
      score += 20;
      reasons.push('DOCX');
    }

    const studyHit = studyAliases.some((alias) => c.normalizedPath.includes(normalizeText(alias)));
    if (studyHit) {
      score += 25;
      reasons.push('tipo de estudo');
    }

    if (listagem) {
      const hasListagem = listagemAliases.some((alias) =>
        c.normalizedPath.includes(normalizeText(alias))
      );
      if (hasListagem) {
        score += 35;
        reasons.push(`listagem ${listagem}`);
      } else {
        score -= 10;
      }
    }

    if (subactivityTokens.length > 0) {
      const hits = subactivityTokens.filter((t) => c.normalizedPath.includes(t)).length;
      if (hits > 0) {
        score += Math.min(30, hits * 8);
        reasons.push(`subatividade (${hits})`);
      }
    }

    const sizeScore = Math.min(15, Math.floor(c.sizeBytes / 150_000));
    score += sizeScore;
    if (sizeScore > 0) reasons.push('completude por tamanho');

    return {
      ...c,
      score,
      reason: reasons.join(', '),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.extension !== b.extension) return a.extension === '.dotx' ? -1 : 1;
    return a.relativePath.localeCompare(b.relativePath);
  });

  const best = scored[0];
  return {
    filePath: best.filePath,
    relativePath: best.relativePath,
    extension: best.extension,
    score: best.score,
    reason: best.reason,
  };
}
