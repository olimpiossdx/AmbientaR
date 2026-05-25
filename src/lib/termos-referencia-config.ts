/**
 * Configuração da pasta "termos de referencia" e vínculo com estudos (Estudos Técnicos).
 *
 * - A pasta base E:\AmbientaR\termos de referencia (ou TERMOS_REFERENCIA_DIR) é carregada como um todo para RAG/indexação.
 * - Estudos com vínculo direto a subpasta:
 *   - PRADA → subpasta PRADA
 *   - PTRF  → subpasta PTRF
 *   - PEA (educação ambiental) → subpasta PEA
 * - Demais pastas/estudos ficam aguardando comando específico de montagem para serem vinculados.
 */

import 'server-only';
import path from 'path';

import type { StudySlug } from '@/lib/termos-referencia-study-folders';
import {
  STUDY_TR_FOLDER,
  LINKED_STUDIES,
  getTrFolderForStudy,
  isStudyLinkedToTr,
} from '@/lib/termos-referencia-study-folders';

export type { StudySlug };
export { STUDY_TR_FOLDER, LINKED_STUDIES, getTrFolderForStudy, isStudyLinkedToTr };
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
