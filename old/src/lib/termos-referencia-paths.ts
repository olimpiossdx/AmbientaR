import path from 'path';
import { getTrFolderForStudy } from '@/lib/termos-referencia-study-folders';

/** Caminho base da pasta "termos de referencia" (sem `server-only` — uso em scripts). */
export function getTermosReferenciaBasePath(): string {
  const fromEnv = process.env.TERMOS_REFERENCIA_DIR?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), 'termos de referencia');
}

/** Caminho absoluto da subpasta de TR para um estudo (ex.: .../termos de referencia/RCA). */
export function getTermosReferenciaPathForStudy(studySlug: string): string | null {
  const base = getTermosReferenciaBasePath();
  const sub = getTrFolderForStudy(studySlug);
  if (!base || !sub) return null;
  return path.join(base, sub);
}
