/**
 * Configuração da pasta "termos de referencia" e vínculo com estudos (Estudos Técnicos).
 *
 * - A pasta base E:\AmbientaR\termos de referencia (ou TERMOS_REFERENCIA_DIR) é carregada como um todo para RAG/indexação.
 * - No primeiro momento apenas dois estudos têm vínculo direto com uma subpasta:
 *   - PRADA → subpasta PRADA
 *   - PTRF  → subpasta PTRF
 * - Demais pastas/estudos ficam aguardando comando específico de montagem para serem vinculados.
 */

import path from 'path';

/** Slug do estudo na rota (ex.: prada, ptrf). */
export type StudySlug = string;

/** Subpasta dentro de "termos de referencia" vinculada a um estudo. */
export const STUDY_TR_FOLDER: Record<string, string> = {
  prada: 'PRADA',
  ptrf: 'PTRF',
};

/** Estudos que já possuem vínculo com subpasta de TR no primeiro momento. */
export const LINKED_STUDIES: StudySlug[] = ['prada', 'ptrf'];

/**
 * Retorna o nome da subpasta de termos de referência vinculada ao estudo, ou null se não houver vínculo.
 */
export function getTrFolderForStudy(studySlug: string): string | null {
  const normalized = studySlug?.toLowerCase().trim() || '';
  return STUDY_TR_FOLDER[normalized] ?? null;
}

/**
 * Retorna true se o estudo tem vínculo com uma subpasta de TR no primeiro momento.
 */
export function isStudyLinkedToTr(studySlug: string): boolean {
  return LINKED_STUDIES.includes(studySlug?.toLowerCase().trim() || '');
}

/**
 * Caminho base da pasta "termos de referencia".
 * Em servidor: process.env.TERMOS_REFERENCIA_DIR ou process.cwd() + 'termos de referencia'.
 */
export function getTermosReferenciaBasePath(): string {
  if (typeof process === 'undefined' || !process.cwd) {
    return '';
  }
  const fromEnv = process.env.TERMOS_REFERENCIA_DIR?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return path.join(process.cwd(), 'termos de referencia');
}

/**
 * Caminho absoluto da subpasta de TR para um estudo (ex.: .../termos de referencia/PRADA).
 * Retorna null se o estudo não tiver vínculo.
 */
export function getTermosReferenciaPathForStudy(studySlug: string): string | null {
  const base = getTermosReferenciaBasePath();
  const sub = getTrFolderForStudy(studySlug);
  if (!base || !sub) return null;
  return path.join(base, sub);
}
