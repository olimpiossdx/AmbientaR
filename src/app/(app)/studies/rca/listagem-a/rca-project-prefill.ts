import type { Empreendedor, Project } from '@/lib/types';
import { RCA_LISTAGEM_A_ACTIVITY } from '@/lib/rca/rca-listagem-a-catalog';
import type { RcaListagemAFormValues } from './rca-listagem-a-schema';
import {
  inferirFormularioRcaListagemA,
  normalizarFormularioTipoRcaListagemA,
  subatividadeParaFormularioRcaListagemA,
} from './rca-listagem-a-registry';

function deepCloneRecord<T>(value: T | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

export type RcaProjectPrefillResult = Partial<RcaListagemAFormValues>;

export function prefillRcaListagemAFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): RcaProjectPrefillResult {
  const projectRecord = project as Record<string, unknown>;
  const subActivityRaw = projectRecord.subActivity as string | undefined;
  const formularioTipo = inferirFormularioRcaListagemA(subActivityRaw);
  const subActivity =
    subActivityRaw?.trim() || subatividadeParaFormularioRcaListagemA(formularioTipo);

  return {
    listagemCode: 'A',
    activity: RCA_LISTAGEM_A_ACTIVITY,
    subActivity,
    formularioTipo,
    empreendimento: {
      projectId: project.id,
      nome: project.fantasyName || project.propertyName || '',
      municipio: project.municipio ?? '',
      endereco: project.address ?? '',
      nomeFantasia: project.fantasyName ?? '',
      cnpj: project.cnpj ?? '',
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
    listagemA: deepCloneRecord(projectRecord.listagemA as Record<string, unknown>) ?? {},
    geographicLocation: deepCloneRecord(project.geographicLocation),
    restricoesLocacionais: deepCloneRecord(
      project.locationalRestrictions ?? projectRecord.locationalRestrictions,
    ),
    unidadesConservacao: deepCloneRecord(
      project.conservationUnit ?? projectRecord.conservationUnit,
    ),
  };
}

export function buildRcaProjectSnapshot(values: RcaListagemAFormValues) {
  return {
    projectId:
      (values.empreendimento as { projectId?: string } | undefined)?.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemA: values.listagemA ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializeRcaListagemAForFirestore(
  values: RcaListagemAFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const termo = values.termoReferencia as
    | { dataEmissao?: Date | string; titulo?: string; processo?: string; versao?: string }
    | undefined;
  const payload: Record<string, unknown> = {
    ...values,
    status,
    listagemCode: 'A',
    formularioTipo: normalizarFormularioTipoRcaListagemA(values.formularioTipo),
    formSource: values.formSource ?? 'react',
    termoReferencia: {
      ...termo,
      dataEmissao: termo?.dataEmissao
        ? new Date(termo.dataEmissao).toISOString()
        : null,
    },
  };

  if (status === 'Aprovado') {
    payload.projectSnapshot = buildRcaProjectSnapshot(values);
  }

  return payload;
}

export function shouldPrefillFromProject(
  status?: string,
  hasSnapshot?: boolean,
): boolean {
  if (status === 'Aprovado' && hasSnapshot) return false;
  return status !== 'Aprovado';
}
