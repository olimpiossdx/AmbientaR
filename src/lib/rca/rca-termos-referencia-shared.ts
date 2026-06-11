import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';

/** Pastas de TR por listagem — nomes completos como no disco (termos de referencia/). */
export const RCA_LISTAGEM_FOLDER_BY_CODE: Record<string, string> = {
  A: LISTAGEM_ACTIVITY_BY_CODE.A,
  B: LISTAGEM_ACTIVITY_BY_CODE.B,
  C: LISTAGEM_ACTIVITY_BY_CODE.C,
  D: LISTAGEM_ACTIVITY_BY_CODE.D,
  E: LISTAGEM_ACTIVITY_BY_CODE.E,
  F: LISTAGEM_ACTIVITY_BY_CODE.F,
  G: LISTAGEM_ACTIVITY_BY_CODE.G,
  H: LISTAGEM_ACTIVITY_BY_CODE.H,
};

/** Listagem A–G: TRs RCA ficam em subpasta `RCA/`. */
export const RCA_LISTAGEM_TR_SUBFOLDER = 'RCA';

/** Listagens com formulário RCA React harmonizado. */
export const RCA_IMPLEMENTED_LISTAGEM_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export type RcaImplementedListagemCode = (typeof RCA_IMPLEMENTED_LISTAGEM_CODES)[number];

export function isRcaListagemImplemented(
  code: string | null | undefined,
): code is RcaImplementedListagemCode {
  if (!code) return false;
  return (RCA_IMPLEMENTED_LISTAGEM_CODES as readonly string[]).includes(code.toUpperCase());
}
