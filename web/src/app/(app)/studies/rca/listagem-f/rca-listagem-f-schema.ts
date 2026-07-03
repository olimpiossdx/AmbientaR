import { z } from 'zod';
import { RCA_LISTAGEM_F_ACTIVITY } from '@/lib/rca/rca-listagem-f-catalog';
import type { RcaFormValues } from '../lib/rca-form-initial-values';
import { getRcaListagemFInitialValues } from '../lib/rca-form-initial-values';
import {
  RCA_LISTAGEM_F_FORM_TIPO_PADRAO,
  subatividadeParaFormularioRcaListagemF,
  type RcaListagemFFormTipo,
} from './rca-listagem-f-registry';

export const rcaListagemFFormSchema = z
  .object({
    activity: z.string().min(1, 'A listagem é obrigatória.'),
    subActivity: z.string().min(1, 'Selecione a subatividade.'),
    listagemCode: z.literal('F'),
    formularioTipo: z.enum(['posto_combustivel']),
    formSource: z.enum(['react', 'dynamic']).optional(),
    empreendedor: z.object({}).passthrough(),
    empreendimento: z.object({}).passthrough(),
  })
  .passthrough();

export type RcaListagemFFormValues = RcaFormValues & {
  listagemCode: 'F';
  formularioTipo: RcaListagemFFormTipo;
};

export function getRcaListagemFDefaultValues(
  partial?: Partial<RcaListagemFFormValues> | null,
): RcaListagemFFormValues {
  const base = getRcaListagemFInitialValues(null);
  const formularioTipo = partial?.formularioTipo ?? RCA_LISTAGEM_F_FORM_TIPO_PADRAO;
  return {
    ...base,
    ...partial,
    listagemCode: 'F',
    activity: partial?.activity || RCA_LISTAGEM_F_ACTIVITY,
    subActivity:
      partial?.subActivity?.trim() ||
      subatividadeParaFormularioRcaListagemF(formularioTipo),
    formularioTipo,
    formSource: partial?.formSource ?? 'react',
  } as RcaListagemFFormValues;
}
