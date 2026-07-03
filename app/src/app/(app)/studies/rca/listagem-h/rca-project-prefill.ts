import type { Empreendedor, Project, CoordinateFormat, GeographicLocationFields } from '@/lib/types';
import { enrichCoordinateBlockWithDecimal } from '@/lib/coordinates';
import { RCA_LISTAGEM_H_ACTIVITY } from '@/lib/rca/rca-listagem-h-catalog';
import type { RcaListagemHFormValues } from './rca-listagem-h-schema';
import {
  extrairCodigoDnDoProjectH,
  inferirFormularioRcaListagemH,
  normalizarFormularioTipoRcaListagemH,
  subatividadeParaFormularioRcaListagemH,
} from './rca-listagem-h-registry';

function deepCloneRecord<T>(value: T | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

export type RcaListagemHProjectPrefillResult = Partial<RcaListagemHFormValues>;

export function prefillRcaListagemHFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): RcaListagemHProjectPrefillResult {
  const projectRecord = project as Record<string, unknown>;
  const subActivityRaw = projectRecord.subActivity as string | undefined;
  const codigoDn = extrairCodigoDnDoProjectH(projectRecord);
  const formularioTipo = inferirFormularioRcaListagemH(subActivityRaw, codigoDn);
  const subActivity =
    subActivityRaw?.trim() || subatividadeParaFormularioRcaListagemH(formularioTipo);

  return {
    listagemCode: 'H',
    activity: RCA_LISTAGEM_H_ACTIVITY,
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
    listagemH: deepCloneRecord(projectRecord.listagemH as Record<string, unknown>) ?? {},
    geographicLocation: deepCloneRecord(project.geographicLocation),
    restricoesLocacionais: deepCloneRecord(
      project.locationalRestrictions ?? projectRecord.locationalRestrictions,
    ),
    unidadesConservacao: deepCloneRecord(
      project.conservationUnit ?? projectRecord.conservationUnit,
    ),
  };
}

export function buildRcaListagemHProjectSnapshot(values: RcaListagemHFormValues) {
  return {
    projectId:
      (values.empreendimento as { projectId?: string } | undefined)?.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemH: values.listagemH ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializeRcaListagemHForFirestore(
  values: RcaListagemHFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const termo = values.termoReferencia as
    | { dataEmissao?: Date | string; titulo?: string; processo?: string; versao?: string }
    | undefined;
  const geo = values.geographicLocation as
    | (Pick<GeographicLocationFields, 'latLong' | 'utm' | 'decimal'> & {
        format?: CoordinateFormat;
      })
    | undefined;
  const geographicLocation =
    geo?.format != null
      ? enrichCoordinateBlockWithDecimal(geo, 'format')
      : values.geographicLocation;
  const payload: Record<string, unknown> = {
    ...values,
    geographicLocation,
    status,
    listagemCode: 'H',
    formularioTipo: normalizarFormularioTipoRcaListagemH(values.formularioTipo),
    formSource: values.formSource ?? 'react',
    termoReferencia: {
      ...termo,
      dataEmissao: termo?.dataEmissao
        ? new Date(termo.dataEmissao).toISOString()
        : null,
    },
  };

  if (status === 'Aprovado') {
    payload.projectSnapshot = buildRcaListagemHProjectSnapshot(values);
  }

  return payload;
}
