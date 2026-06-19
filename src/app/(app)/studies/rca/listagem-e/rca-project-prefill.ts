import { enrichCoordinateBlockWithDecimal } from '@/lib/coordinates';
import type { CoordinateFormat, Empreendedor, GeographicLocationFields, Project } from '@/lib/types';
import { RCA_LISTAGEM_E_ACTIVITY } from '@/lib/rca/rca-listagem-e-catalog';
import type { RcaListagemEFormValues } from './rca-listagem-e-schema';
import {
  extrairCodigoDnDoProjectE,
  inferirFormularioRcaListagemE,
  normalizarFormularioTipoRcaListagemE,
  subatividadeParaFormularioRcaListagemE,
} from './rca-listagem-e-registry';

function deepCloneRecord<T>(value: T | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

export type RcaListagemEProjectPrefillResult = Partial<RcaListagemEFormValues>;

export function prefillRcaListagemEFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): RcaListagemEProjectPrefillResult {
  const projectRecord = project as Record<string, unknown>;
  const subActivityRaw = projectRecord.subActivity as string | undefined;
  const codigoDn = extrairCodigoDnDoProjectE(projectRecord);
  const formularioTipo = inferirFormularioRcaListagemE(subActivityRaw, codigoDn);
  const subActivity =
    subActivityRaw?.trim() || subatividadeParaFormularioRcaListagemE(formularioTipo);

  return {
    listagemCode: 'E',
    activity: RCA_LISTAGEM_E_ACTIVITY,
    subActivity,
    formularioTipo,
    empreendimento: {
      projectId: project.id,
      nome: project.fantasyName || project.propertyName || '',
      municipio: project.municipio ?? '',
      endereco: project.address ?? '',
      nomeFantasia: project.fantasyName ?? '',
      cnpj: project.cnpj ?? '',
      codigoDn: codigoDn ?? undefined,
    },
    empreendedor: empreendedor
      ? {
          clientId: empreendedor.id,
          nome: empreendedor.name ?? '',
          cpfCnpj: empreendedor.cpfCnpj ?? '',
          endereco: empreendedor.address ?? '',
          email: empreendedor.email ?? '',
          fone: empreendedor.phone ?? '',
        }
      : undefined,
    listagemE: deepCloneRecord(projectRecord.listagemE as Record<string, unknown>) ?? {},
    geographicLocation: deepCloneRecord(project.geographicLocation),
    restricoesLocacionais: deepCloneRecord(
      project.locationalRestrictions ?? projectRecord.locationalRestrictions,
    ),
    unidadesConservacao: deepCloneRecord(
      project.conservationUnit ?? projectRecord.conservationUnit,
    ),
  };
}

export function buildRcaListagemEProjectSnapshot(values: RcaListagemEFormValues) {
  return {
    projectId:
      (values.empreendimento as { projectId?: string } | undefined)?.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemE: values.listagemE ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializeRcaListagemEForFirestore(
  values: RcaListagemEFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const termo = values.termoReferencia as
    | { dataEmissao?: Date | string; titulo?: string; processo?: string; versao?: string }
    | undefined;
  const listagemE = values.listagemE as
    | {
        geoTrecho?: {
          inicio?: Pick<GeographicLocationFields, 'latLong' | 'utm' | 'decimal'> & {
            formato?: CoordinateFormat;
          };
          fim?: Pick<GeographicLocationFields, 'latLong' | 'utm' | 'decimal'> & {
            formato?: CoordinateFormat;
          };
          [key: string]: unknown;
        };
        [key: string]: unknown;
      }
    | undefined;
  const geoTrecho = listagemE?.geoTrecho;
  const enrichedListagemE =
    geoTrecho != null
      ? {
          ...listagemE,
          geoTrecho: {
            ...geoTrecho,
            ...(geoTrecho.inicio?.formato != null
              ? { inicio: enrichCoordinateBlockWithDecimal(geoTrecho.inicio, 'formato') }
              : {}),
            ...(geoTrecho.fim?.formato != null
              ? { fim: enrichCoordinateBlockWithDecimal(geoTrecho.fim, 'formato') }
              : {}),
          },
        }
      : listagemE;
  const payload: Record<string, unknown> = {
    ...values,
    listagemE: enrichedListagemE,
    status,
    listagemCode: 'E',
    formularioTipo: normalizarFormularioTipoRcaListagemE(values.formularioTipo),
    formSource: values.formSource ?? 'react',
    termoReferencia: {
      ...termo,
      dataEmissao: termo?.dataEmissao
        ? new Date(termo.dataEmissao).toISOString()
        : null,
    },
  };

  if (status === 'Aprovado') {
    payload.projectSnapshot = buildRcaListagemEProjectSnapshot(values);
  }

  return payload;
}
