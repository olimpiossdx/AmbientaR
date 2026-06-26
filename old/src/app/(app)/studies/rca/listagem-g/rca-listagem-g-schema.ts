import { z } from 'zod';
import { RCA_LISTAGEM_G_ACTIVITY } from '@/lib/rca/rca-listagem-g-catalog';
import type { RcaFormValues } from '../lib/rca-form-initial-values';
import { getRcaListagemGInitialValues } from '../lib/rca-form-initial-values';
import {
  RCA_LISTAGEM_G_FORM_TIPO_PADRAO,
  subatividadeParaFormularioRcaListagemG,
  type RcaListagemGFormTipo,
} from './rca-listagem-g-registry';

export const rcaListagemGFormSchema = z
  .object({
    activity: z.string().min(1, 'A listagem é obrigatória.'),
    subActivity: z.string().min(1, 'Selecione a subatividade.'),
    listagemCode: z.literal('G'),
    formularioTipo: z.enum([
      'culturas',
      'bovinocultura',
      'irrigados',
      'silvicultura',
      'graos',
      'suinocultura',
      'avicultura',
    ]),
    formSource: z.enum(['react', 'dynamic']).optional(),
    empreendedor: z.object({}).passthrough(),
    empreendimento: z.object({}).passthrough(),
  })
  .passthrough();

export type RcaListagemGFormValues = RcaFormValues & {
  listagemCode: 'G';
  formularioTipo: RcaListagemGFormTipo;
};

export function getRcaListagemGDefaultValues(
  partial?: Partial<RcaListagemGFormValues> | null,
): RcaListagemGFormValues {
  const base = getRcaListagemGInitialValues(null);
  const formularioTipo = partial?.formularioTipo ?? RCA_LISTAGEM_G_FORM_TIPO_PADRAO;
  return {
    ...base,
    ...partial,
    listagemCode: 'G',
    activity: partial?.activity || RCA_LISTAGEM_G_ACTIVITY,
    subActivity:
      partial?.subActivity?.trim() ||
      subatividadeParaFormularioRcaListagemG(formularioTipo),
    formularioTipo,
    formSource: partial?.formSource ?? 'react',
  } as RcaListagemGFormValues;
}
