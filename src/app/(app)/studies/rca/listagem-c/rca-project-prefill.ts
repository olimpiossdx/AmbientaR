import type { Empreendedor, Project } from '@/lib/types';
import { RCA_LISTAGEM_C_ACTIVITY } from '@/lib/rca/rca-listagem-c-catalog';
import type { RcaListagemCFormValues } from './rca-listagem-c-schema';
import {
  extrairCodigoDnDoProjectC,
  inferirFormularioRcaListagemC,
  normalizarFormularioTipoRcaListagemC,
  subatividadeParaFormularioRcaListagemC,
} from './rca-listagem-c-registry';

function deepCloneRecord<T>(value: T | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

export type RcaListagemCProjectPrefillResult = Partial<RcaListagemCFormValues>;

export function prefillRcaListagemCFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): RcaListagemCProjectPrefillResult {
  const projectRecord = project as Record<string, unknown>;
  const subActivityRaw = projectRecord.subActivity as string | undefined;
  const formularioTipo = inferirFormularioRcaListagemC(subActivityRaw);
  const subActivity =
    subActivityRaw?.trim() || subatividadeParaFormularioRcaListagemC(formularioTipo);
  const codigoDn = extrairCodigoDnDoProjectC(projectRecord);

  return {
    listagemCode: 'C',
    activity: RCA_LISTAGEM_C_ACTIVITY,
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
    listagemC: deepCloneRecord(projectRecord.listagemC as Record<string, unknown>) ?? {},
    geographicLocation: deepCloneRecord(project.geographicLocation),
    restricoesLocacionais: deepCloneRecord(
      project.locationalRestrictions ?? projectRecord.locationalRestrictions,
    ),
    unidadesConservacao: deepCloneRecord(
      project.conservationUnit ?? projectRecord.conservationUnit,
    ),
  };
}

export function buildRcaListagemCProjectSnapshot(values: RcaListagemCFormValues) {
  return {
    projectId:
      (values.empreendimento as { projectId?: string } | undefined)?.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemC: values.listagemC ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializeRcaListagemCForFirestore(
  values: RcaListagemCFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const termo = values.termoReferencia as
    | { dataEmissao?: Date | string; titulo?: string; processo?: string; versao?: string }
    | undefined;
  const payload: Record<string, unknown> = {
    ...values,
    status,
    listagemCode: 'C',
    formularioTipo: normalizarFormularioTipoRcaListagemC(values.formularioTipo),
    formSource: values.formSource ?? 'react',
    termoReferencia: {
      ...termo,
      dataEmissao: termo?.dataEmissao
        ? new Date(termo.dataEmissao).toISOString()
        : null,
    },
  };

  if (status === 'Aprovado') {
    payload.projectSnapshot = buildRcaListagemCProjectSnapshot(values);
  }

  return payload;
}
