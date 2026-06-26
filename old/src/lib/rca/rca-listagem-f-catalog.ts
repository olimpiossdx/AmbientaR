import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';
import { RCA_SUBACTIVITIES } from '@/lib/rca-listagem-catalog';

export const RCA_LISTAGEM_F_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.F;

export const RCA_LISTAGEM_F_SUBACTIVITIES =
  RCA_SUBACTIVITIES[RCA_LISTAGEM_F_ACTIVITY] ?? [];

/** Código DN – posto revendedor de combustíveis. */
export const RCA_LISTAGEM_F_CODIGO_POSTO = 'F-06-01-7';
