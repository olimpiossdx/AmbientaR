import { z } from 'zod';
import { RCA_LISTAGEM_A_ACTIVITY } from '@/lib/rca/rca-listagem-a-catalog';
import type { RcaFormValues } from '../lib/rca-form-initial-values';
import { getRcaListagemAInitialValues } from '../lib/rca-form-initial-values';
import {
  RCA_LISTAGEM_A_FORM_TIPO_PADRAO,
  subatividadeParaFormularioRcaListagemA,
  type RcaListagemAFormTipo,
} from './rca-listagem-a-registry';

export const rcaListagemAFormSchema = z
  .object({
    activity: z.string().min(1, 'A listagem é obrigatória.'),
    subActivity: z.string().min(1, 'Selecione a subatividade.'),
    listagemCode: z.literal('A'),
    formularioTipo: z.enum([
      'lavra_subterranea',
      'rochas_ornamentais',
      'extracao_areia_cascalho',
      'barragem_rejeitos',
    ]),
    formSource: z.enum(['react', 'dynamic']).optional(),
    empreendedor: z.object({}).passthrough(),
    empreendimento: z.object({}).passthrough(),
  })
  .passthrough();

export type RcaListagemAFormValues = RcaFormValues & {
  listagemCode: 'A';
  formularioTipo: RcaListagemAFormTipo;
};

export function getRcaListagemADefaultValues(
  partial?: Partial<RcaListagemAFormValues> | null,
): RcaListagemAFormValues {
  const base = getRcaListagemAInitialValues(null);
  const formularioTipo = partial?.formularioTipo ?? RCA_LISTAGEM_A_FORM_TIPO_PADRAO;
  return {
    ...base,
    ...partial,
    listagemCode: 'A',
    activity: partial?.activity || RCA_LISTAGEM_A_ACTIVITY,
    subActivity:
      partial?.subActivity?.trim() ||
      subatividadeParaFormularioRcaListagemA(formularioTipo),
    formularioTipo,
    formSource: partial?.formSource ?? 'react',
  } as RcaListagemAFormValues;
}
