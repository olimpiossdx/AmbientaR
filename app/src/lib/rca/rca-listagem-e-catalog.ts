import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';
import { RCA_SUBACTIVITIES } from '@/lib/rca-listagem-catalog';

export const RCA_LISTAGEM_E_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.E;

export const RCA_LISTAGEM_E_SUBACTIVITIES =
  RCA_SUBACTIVITIES[RCA_LISTAGEM_E_ACTIVITY] ?? [];

/** Códigos DN 217/17 de dutos/gasodutos (empreendimento). */
export const RCA_LISTAGEM_E_CODIGOS_GASODUTO = [
  'E-01-10-4',
  'E-01-11-2',
  'E-01-12-0',
  'E-01-13-9',
] as const;
