import { z } from 'zod';
import { RCA_LISTAGEM_E_ACTIVITY } from '@/lib/rca/rca-listagem-e-catalog';
import { createDefaultTrechoCoordinateBlock } from '@/lib/coordinates';
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

/** Bloco técnico RCA Listagem E — espelha cadastro empreendimento (listagemE.*, geoTrecho.inicio/fim). */
export const rcaListagemETecnicoSchema = z.any().optional();

export const rcaListagemEFormSchema = z
  .object({
    activity: z.string().min(1, 'A listagem é obrigatória.'),
    subActivity: z.string().min(1, 'Selecione a subatividade.'),
    listagemCode: z.literal('E'),
    formularioTipo: formularioTipoEnum,
    formSource: z.enum(['react', 'dynamic']).optional(),
    empreendedor: z.object({}).passthrough(),
    empreendimento: z.object({}).passthrough(),
    listagemE: rcaListagemETecnicoSchema,
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
  const mergedListagemE = {
    ...((base.listagemE as object) ?? {}),
    ...(partial?.listagemE ?? {}),
  };
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
    listagemE: {
      ...mergedListagemE,
      geoTrecho: {
        ...((mergedListagemE as { geoTrecho?: object }).geoTrecho ?? {}),
        inicio: {
          ...createDefaultTrechoCoordinateBlock(),
          ...((mergedListagemE as { geoTrecho?: { inicio?: object } }).geoTrecho?.inicio),
        },
        fim: {
          ...createDefaultTrechoCoordinateBlock(),
          ...((mergedListagemE as { geoTrecho?: { fim?: object } }).geoTrecho?.fim),
        },
      },
    },
  } as RcaListagemEFormValues;
}
