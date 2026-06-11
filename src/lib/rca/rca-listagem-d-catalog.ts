import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';
import { RCA_SUBACTIVITIES } from '@/lib/rca-listagem-catalog';

export const RCA_LISTAGEM_D_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.D;

export const RCA_LISTAGEM_D_SUBACTIVITIES =
  RCA_SUBACTIVITIES[RCA_LISTAGEM_D_ACTIVITY] ?? [];
