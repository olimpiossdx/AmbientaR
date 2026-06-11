import { z } from 'zod';
import { RCA_LISTAGEM_B_ACTIVITY } from '@/lib/rca/rca-listagem-b-catalog';
import type { RcaFormValues } from '../lib/rca-form-initial-values';
import { getRcaListagemBInitialValues } from '../lib/rca-form-initial-values';
import {
  RCA_LISTAGEM_B_FORM_TIPO_PADRAO,
  subatividadeParaFormularioRcaListagemB,
  type RcaListagemBFormTipo,
} from './rca-listagem-b-registry';

export const rcaListagemBFormSchema = z
  .object({
    activity: z.string().min(1, 'A listagem é obrigatória.'),
    subActivity: z.string().min(1, 'Selecione a subatividade.'),
    listagemCode: z.literal('B'),
    formularioTipo: z.enum([
      'telhas_tijolos',
      'materiais_ceramicos',
      'siderurgia',
      'ligas_ferrosas',
      'fundidos_ferro_aco',
      'fundidos_nao_ferrosos',
      'moveis',
    ]),
    formSource: z.enum(['react', 'dynamic']).optional(),
    empreendedor: z.object({}).passthrough(),
    empreendimento: z.object({}).passthrough(),
  })
  .passthrough();

export type RcaListagemBFormValues = RcaFormValues & {
  listagemCode: 'B';
  formularioTipo: RcaListagemBFormTipo;
};

export function getRcaListagemBDefaultValues(
  partial?: Partial<RcaListagemBFormValues> | null,
): RcaListagemBFormValues {
  const base = getRcaListagemBInitialValues(null);
  const formularioTipo = partial?.formularioTipo ?? RCA_LISTAGEM_B_FORM_TIPO_PADRAO;
  return {
    ...base,
    ...partial,
    listagemCode: 'B',
    activity: partial?.activity || RCA_LISTAGEM_B_ACTIVITY,
    subActivity:
      partial?.subActivity?.trim() ||
      subatividadeParaFormularioRcaListagemB(formularioTipo),
    formularioTipo,
    formSource: partial?.formSource ?? 'react',
  } as RcaListagemBFormValues;
}
