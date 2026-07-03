import { z } from 'zod';
import { RCA_LISTAGEM_H_ACTIVITY } from '@/lib/rca/rca-listagem-h-catalog';
import type { RcaFormValues } from '../lib/rca-form-initial-values';
import { getRcaListagemHInitialValues } from '../lib/rca-form-initial-values';
import {
  RCA_LISTAGEM_H_FORM_TIPO_PADRAO,
  subatividadeParaFormularioRcaListagemH,
  type RcaListagemHFormTipo,
} from './rca-listagem-h-registry';

export const rcaListagemHFormSchema = z
  .object({
    activity: z.string().min(1, 'A listagem é obrigatória.'),
    subActivity: z.string().min(1, 'Selecione a subatividade.'),
    listagemCode: z.literal('H'),
    formularioTipo: z.enum(['supressao_mata_atlantica']),
    formSource: z.enum(['react', 'dynamic']).optional(),
    empreendedor: z.object({}).passthrough(),
    empreendimento: z.object({}).passthrough(),
  })
  .passthrough();

export type RcaListagemHFormValues = RcaFormValues & {
  listagemCode: 'H';
  formularioTipo: RcaListagemHFormTipo;
};

export function getRcaListagemHDefaultValues(
  partial?: Partial<RcaListagemHFormValues> | null,
): RcaListagemHFormValues {
  const base = getRcaListagemHInitialValues(null);
  const formularioTipo = partial?.formularioTipo ?? RCA_LISTAGEM_H_FORM_TIPO_PADRAO;
  return {
    ...base,
    ...partial,
    listagemCode: 'H',
    activity: partial?.activity || RCA_LISTAGEM_H_ACTIVITY,
    subActivity:
      partial?.subActivity?.trim() ||
      subatividadeParaFormularioRcaListagemH(formularioTipo),
    formularioTipo,
    formSource: partial?.formSource ?? 'react',
  } as RcaListagemHFormValues;
}
