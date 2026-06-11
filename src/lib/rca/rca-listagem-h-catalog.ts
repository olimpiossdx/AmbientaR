import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';
import { RCA_SUBACTIVITIES } from '@/lib/rca-listagem-catalog';

export const RCA_LISTAGEM_H_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.H;

export const RCA_LISTAGEM_H_SUBACTIVITIES =
  RCA_SUBACTIVITIES[RCA_LISTAGEM_H_ACTIVITY] ?? [];

/** Código DN – supressão em Mata Atlântica (Lei 11.428/2006). */
export const RCA_LISTAGEM_H_CODIGO_PRINCIPAL = 'H-01-01-1';
