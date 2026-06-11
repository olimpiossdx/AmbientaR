import type { Empreendedor, Project } from '@/lib/types';
import { RCA_LISTAGEM_B_ACTIVITY } from '@/lib/rca/rca-listagem-b-catalog';
import type { RcaListagemBFormValues } from './rca-listagem-b-schema';
import {
  extrairCodigoDnDoProjectB,
  inferirFormularioRcaListagemB,
  normalizarFormularioTipoRcaListagemB,
  subatividadeParaFormularioRcaListagemB,
} from './rca-listagem-b-registry';

function deepCloneRecord<T>(value: T | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

export type RcaListagemBProjectPrefillResult = Partial<RcaListagemBFormValues>;

export function prefillRcaListagemBFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): RcaListagemBProjectPrefillResult {
  const projectRecord = project as Record<string, unknown>;
  const subActivityRaw = projectRecord.subActivity as string | undefined;
  const formularioTipo = inferirFormularioRcaListagemB(subActivityRaw);
  const subActivity =
    subActivityRaw?.trim() || subatividadeParaFormularioRcaListagemB(formularioTipo);
  const codigoDn = extrairCodigoDnDoProjectB(projectRecord);

  return {
    listagemCode: 'B',
    activity: RCA_LISTAGEM_B_ACTIVITY,
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
    listagemB: deepCloneRecord(projectRecord.listagemB as Record<string, unknown>) ?? {},
    geographicLocation: deepCloneRecord(project.geographicLocation),
    restricoesLocacionais: deepCloneRecord(
      project.locationalRestrictions ?? projectRecord.locationalRestrictions,
    ),
    unidadesConservacao: deepCloneRecord(
      project.conservationUnit ?? projectRecord.conservationUnit,
    ),
  };
}

export function buildRcaListagemBProjectSnapshot(values: RcaListagemBFormValues) {
  return {
    projectId:
      (values.empreendimento as { projectId?: string } | undefined)?.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemB: values.listagemB ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializeRcaListagemBForFirestore(
  values: RcaListagemBFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const termo = values.termoReferencia as
    | { dataEmissao?: Date | string; titulo?: string; processo?: string; versao?: string }
    | undefined;
  const payload: Record<string, unknown> = {
    ...values,
    status,
    listagemCode: 'B',
    formularioTipo: normalizarFormularioTipoRcaListagemB(values.formularioTipo),
    formSource: values.formSource ?? 'react',
    termoReferencia: {
      ...termo,
      dataEmissao: termo?.dataEmissao
        ? new Date(termo.dataEmissao).toISOString()
        : null,
    },
  };

  if (status === 'Aprovado') {
    payload.projectSnapshot = buildRcaListagemBProjectSnapshot(values);
  }

  return payload;
}
