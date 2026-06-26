import { z } from 'zod';
import { RCA_LISTAGEM_C_ACTIVITY } from '@/lib/rca/rca-listagem-c-catalog';
import type { RcaFormValues } from '../lib/rca-form-initial-values';
import { getRcaListagemCInitialValues } from '../lib/rca-form-initial-values';
import {
  RCA_LISTAGEM_C_FORM_TIPO_PADRAO,
  subatividadeParaFormularioRcaListagemC,
  type RcaListagemCFormTipo,
} from './rca-listagem-c-registry';

export const rcaListagemCFormSchema = z
  .object({
    activity: z.string().min(1, 'A listagem é obrigatória.'),
    subActivity: z.string().min(1, 'Selecione a subatividade.'),
    listagemCode: z.literal('C'),
    formularioTipo: z.enum([
      'explosivos',
      'farmaceutico',
      'papel_papelao',
      'borracha',
      'couros_peles',
      'plasticos',
      'produtos_limpeza',
    ]),
    formSource: z.enum(['react', 'dynamic']).optional(),
    empreendedor: z.object({}).passthrough(),
    empreendimento: z.object({}).passthrough(),
  })
  .passthrough();

export type RcaListagemCFormValues = RcaFormValues & {
  listagemCode: 'C';
  formularioTipo: RcaListagemCFormTipo;
};

export function getRcaListagemCDefaultValues(
  partial?: Partial<RcaListagemCFormValues> | null,
): RcaListagemCFormValues {
  const base = getRcaListagemCInitialValues(null);
  const formularioTipo = partial?.formularioTipo ?? RCA_LISTAGEM_C_FORM_TIPO_PADRAO;
  return {
    ...base,
    ...partial,
    listagemCode: 'C',
    activity: partial?.activity || RCA_LISTAGEM_C_ACTIVITY,
    subActivity:
      partial?.subActivity?.trim() ||
      subatividadeParaFormularioRcaListagemC(formularioTipo),
    formularioTipo,
    formSource: partial?.formSource ?? 'react',
  } as RcaListagemCFormValues;
}
