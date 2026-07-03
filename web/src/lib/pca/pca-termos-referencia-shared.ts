import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';

/** Pastas de TR por listagem — nomes completos como no disco (termos de referencia/). */
export const PCA_LISTAGEM_FOLDER_BY_CODE: Record<string, string> = {
  A: LISTAGEM_ACTIVITY_BY_CODE.A,
  B: LISTAGEM_ACTIVITY_BY_CODE.B,
  C: LISTAGEM_ACTIVITY_BY_CODE.C,
  D: LISTAGEM_ACTIVITY_BY_CODE.D,
  E: LISTAGEM_ACTIVITY_BY_CODE.E,
  F: LISTAGEM_ACTIVITY_BY_CODE.F,
  G: LISTAGEM_ACTIVITY_BY_CODE.G,
  H: LISTAGEM_ACTIVITY_BY_CODE.H,
};

/** Listagem A: TRs PCA ficam em subpasta `PCA/`. */
export const PCA_LISTAGEM_A_TR_SUBFOLDER = 'PCA';

/** Listagens com formulário PCA React implementado. */
export const PCA_IMPLEMENTED_LISTAGEM_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export type PcaImplementedListagemCode = (typeof PCA_IMPLEMENTED_LISTAGEM_CODES)[number];

export function isPcaListagemImplemented(code: string | null | undefined): code is PcaImplementedListagemCode {
  if (!code) return false;
  return (PCA_IMPLEMENTED_LISTAGEM_CODES as readonly string[]).includes(code.toUpperCase());
}
