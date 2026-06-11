import { z } from 'zod';
import { RCA_LISTAGEM_E_ACTIVITY } from '@/lib/rca/rca-listagem-e-catalog';
import type { RcaFormValues } from '../lib/rca-form-initial-values';
import { getRcaListagemEInitialValues } from '../lib/rca-form-initial-values';
import {
  RCA_LISTAGEM_E_FORM_TIPO_PADRAO,
  subatividadeParaFormularioRcaListagemE,
  type RcaListagemEFormTipo,
} from './rca-listagem-e-registry';

const formularioTipoEnum = z.enum([
  'rodovias',
  'gasoduto',
  'recapacitacao_cgh_pch',
  'biogas_aterro',
  'biometanizacao_rsu',
  'tratamento_termico_rsu',
  'barragem_saneamento',
  'abastecimento_agua',
  'esgotamento_sanitario',
  'tratamento_rsu',
  'solo_urbano',
  'dragagem',
]);

export const rcaListagemEFormSchema = z
  .object({
    activity: z.string().min(1, 'A listagem é obrigatória.'),
    subActivity: z.string().min(1, 'Selecione a subatividade.'),
    listagemCode: z.literal('E'),
    formularioTipo: formularioTipoEnum,
    formSource: z.enum(['react', 'dynamic']).optional(),
    empreendedor: z.object({}).passthrough(),
    empreendimento: z.object({}).passthrough(),
  })
  .passthrough();

export type RcaListagemEFormValues = RcaFormValues & {
  listagemCode: 'E';
  formularioTipo: RcaListagemEFormTipo;
};

export function getRcaListagemEDefaultValues(
  partial?: Partial<RcaListagemEFormValues> | null,
): RcaListagemEFormValues {
  const base = getRcaListagemEInitialValues(null);
  const formularioTipo = partial?.formularioTipo ?? RCA_LISTAGEM_E_FORM_TIPO_PADRAO;
  return {
    ...base,
    ...partial,
    listagemCode: 'E',
    activity: partial?.activity || RCA_LISTAGEM_E_ACTIVITY,
    subActivity:
      partial?.subActivity?.trim() ||
      subatividadeParaFormularioRcaListagemE(formularioTipo),
    formularioTipo,
    formSource: partial?.formSource ?? 'react',
  } as RcaListagemEFormValues;
}
