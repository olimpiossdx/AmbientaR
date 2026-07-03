import { z } from 'zod';
import { RCA_LISTAGEM_D_ACTIVITY } from '@/lib/rca/rca-listagem-d-catalog';
import type { RcaFormValues } from '../lib/rca-form-initial-values';
import { getRcaListagemDInitialValues } from '../lib/rca-form-initial-values';
import {
  RCA_LISTAGEM_D_FORM_TIPO_PADRAO,
  subatividadeParaFormularioRcaListagemD,
  type RcaListagemDFormTipo,
} from './rca-listagem-d-registry';

export const rcaListagemDFormSchema = z
  .object({
    activity: z.string().min(1, 'A listagem é obrigatória.'),
    subActivity: z.string().min(1, 'Selecione a subatividade.'),
    listagemCode: z.literal('D'),
    formularioTipo: z.enum([
      'aguardente',
      'laticinios',
      'abatedouros',
      'racao_animal',
      'subprodutos_animal',
      'oleos_gorduras',
    ]),
    formSource: z.enum(['react', 'dynamic']).optional(),
    empreendedor: z.object({}).passthrough(),
    empreendimento: z.object({}).passthrough(),
  })
  .passthrough();

export type RcaListagemDFormValues = RcaFormValues & {
  listagemCode: 'D';
  formularioTipo: RcaListagemDFormTipo;
};

export function getRcaListagemDDefaultValues(
  partial?: Partial<RcaListagemDFormValues> | null,
): RcaListagemDFormValues {
  const base = getRcaListagemDInitialValues(null);
  const formularioTipo = partial?.formularioTipo ?? RCA_LISTAGEM_D_FORM_TIPO_PADRAO;
  return {
    ...base,
    ...partial,
    listagemCode: 'D',
    activity: partial?.activity || RCA_LISTAGEM_D_ACTIVITY,
    subActivity:
      partial?.subActivity?.trim() ||
      subatividadeParaFormularioRcaListagemD(formularioTipo),
    formularioTipo,
    formSource: partial?.formSource ?? 'react',
  } as RcaListagemDFormValues;
}
