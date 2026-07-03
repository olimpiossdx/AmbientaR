import 'server-only';

import path from 'path';
import { access } from 'fs/promises';
import { getTermosReferenciaBasePath } from '@/lib/termos-referencia-paths';
import {
  RCA_LISTAGEM_FOLDER_BY_CODE,
  RCA_LISTAGEM_TR_SUBFOLDER,
} from '@/lib/rca/rca-termos-referencia-shared';

export {
  RCA_LISTAGEM_FOLDER_BY_CODE,
  RCA_LISTAGEM_TR_SUBFOLDER,
  RCA_IMPLEMENTED_LISTAGEM_CODES,
  isRcaListagemImplemented,
} from '@/lib/rca/rca-termos-referencia-shared';
export type { RcaImplementedListagemCode } from '@/lib/rca/rca-termos-referencia-shared';

/** Caminho absoluto da pasta TR do RCA para uma listagem (…/LISTAGEM X/RCA). */
export function getRcaTermosReferenciaPath(listagemCode: string): string | null {
  const code = listagemCode?.trim().toUpperCase();
  if (!code) return null;
  const folder = RCA_LISTAGEM_FOLDER_BY_CODE[code];
  if (!folder) return null;
  return path.join(getTermosReferenciaBasePath(), folder, RCA_LISTAGEM_TR_SUBFOLDER);
}

/** Resolve pasta TR RCA verificando existência no disco. */
export async function resolveRcaTermosReferenciaPath(
  listagemCode: string,
): Promise<string | null> {
  const primary = getRcaTermosReferenciaPath(listagemCode);
  if (!primary) return null;
  try {
    await access(primary);
    return primary;
  } catch {
    const code = listagemCode?.trim().toUpperCase();
    const folder = RCA_LISTAGEM_FOLDER_BY_CODE[code ?? ''];
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
