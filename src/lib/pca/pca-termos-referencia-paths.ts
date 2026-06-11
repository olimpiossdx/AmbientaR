import 'server-only';

import path from 'path';
import { access } from 'fs/promises';
import { extractListagemCode } from '@/lib/listagem-activities';
import { getTermosReferenciaBasePath } from '@/lib/termos-referencia-paths';
import {
  PCA_LISTAGEM_A_TR_SUBFOLDER,
  PCA_LISTAGEM_FOLDER_BY_CODE,
} from '@/lib/pca/pca-termos-referencia-shared';

export {
  PCA_LISTAGEM_A_TR_SUBFOLDER,
  PCA_LISTAGEM_FOLDER_BY_CODE,
  PCA_IMPLEMENTED_LISTAGEM_CODES,
  isPcaListagemImplemented,
} from '@/lib/pca/pca-termos-referencia-shared';
export type { PcaImplementedListagemCode } from '@/lib/pca/pca-termos-referencia-shared';

/** Caminho absoluto da pasta TR do PCA para uma listagem. */
export function getPcaTermosReferenciaPath(listagemCode: string): string | null {
  const code = listagemCode?.trim().toUpperCase();
  if (!code) return null;
  const folder = PCA_LISTAGEM_FOLDER_BY_CODE[code];
  if (!folder) return null;
  const base = path.join(getTermosReferenciaBasePath(), folder);
  if (code === 'A') {
    return path.join(base, PCA_LISTAGEM_A_TR_SUBFOLDER);
  }
  return base;
}

/**
 * Resolve pasta TR para estudo PCA a partir da atividade/listagem selecionada.
 * Para Listagem A, tenta `…/LISTAGEM A – …/PCA` e faz fallback para a pasta da listagem.
 */
export async function resolvePcaTermosReferenciaPath(listagemCode: string): Promise<string | null> {
  const primary = getPcaTermosReferenciaPath(listagemCode);
  if (!primary) return null;
  try {
    await access(primary);
    return primary;
  } catch {
    const code = listagemCode?.trim().toUpperCase();
    const folder = PCA_LISTAGEM_FOLDER_BY_CODE[code ?? ''];
    if (!folder) return null;
    const fallback = path.join(getTermosReferenciaBasePath(), folder);
    try {
      await access(fallback);
      return fallback;
    } catch {
      return primary;
    }
  }
}

/**
 * Resolve pasta TR para estudo PCA a partir da atividade/listagem selecionada (síncrono).
 * Preferir {@link resolvePcaTermosReferenciaPath} quando for verificar existência no disco.
 */
export function getTermosReferenciaPathForPcaStudy(activity?: string | null): string | null {
  const code = extractListagemCode(activity);
  if (!code) return null;
  return getPcaTermosReferenciaPath(code);
}
