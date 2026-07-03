import type { Empreendedor, Project, CoordinateFormat, GeographicLocationFields } from '@/lib/types';
import { enrichCoordinateBlockWithDecimal } from '@/lib/coordinates';
import { RCA_LISTAGEM_D_ACTIVITY } from '@/lib/rca/rca-listagem-d-catalog';
import type { RcaListagemDFormValues } from './rca-listagem-d-schema';
import {
  extrairCodigoDnDoProjectD,
  inferirFormularioRcaListagemD,
  normalizarFormularioTipoRcaListagemD,
  subatividadeParaFormularioRcaListagemD,
} from './rca-listagem-d-registry';

function deepCloneRecord<T>(value: T | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

export type RcaListagemDProjectPrefillResult = Partial<RcaListagemDFormValues>;

export function prefillRcaListagemDFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): RcaListagemDProjectPrefillResult {
  const projectRecord = project as Record<string, unknown>;
  const subActivityRaw = projectRecord.subActivity as string | undefined;
  const formularioTipo = inferirFormularioRcaListagemD(subActivityRaw);
  const subActivity =
    subActivityRaw?.trim() || subatividadeParaFormularioRcaListagemD(formularioTipo);
  const codigoDn = extrairCodigoDnDoProjectD(projectRecord);

  return {
    listagemCode: 'D',
    activity: RCA_LISTAGEM_D_ACTIVITY,
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
    listagemD: deepCloneRecord(projectRecord.listagemD as Record<string, unknown>) ?? {},
    geographicLocation: deepCloneRecord(project.geographicLocation),
    restricoesLocacionais: deepCloneRecord(
      project.locationalRestrictions ?? projectRecord.locationalRestrictions,
    ),
    unidadesConservacao: deepCloneRecord(
      project.conservationUnit ?? projectRecord.conservationUnit,
    ),
  };
}

export function buildRcaListagemDProjectSnapshot(values: RcaListagemDFormValues) {
  return {
    projectId:
      (values.empreendimento as { projectId?: string } | undefined)?.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemD: values.listagemD ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializeRcaListagemDForFirestore(
  values: RcaListagemDFormValues,
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
    listagemCode: 'D',
    formularioTipo: normalizarFormularioTipoRcaListagemD(values.formularioTipo),
    formSource: values.formSource ?? 'react',
    termoReferencia: {
      ...termo,
      dataEmissao: termo?.dataEmissao
        ? new Date(termo.dataEmissao).toISOString()
        : null,
    },
  };

  if (status === 'Aprovado') {
    payload.projectSnapshot = buildRcaListagemDProjectSnapshot(values);
  }

  return payload;
}
