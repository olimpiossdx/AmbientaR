import type { Empreendedor, Project } from '@/lib/types';
import { RCA_LISTAGEM_G_ACTIVITY } from '@/lib/rca/rca-listagem-g-catalog';
import type { RcaListagemGFormValues } from './rca-listagem-g-schema';
import {
  extrairCodigoDnDoProjectG,
  inferirFormularioRcaListagemG,
  normalizarFormularioTipoRcaListagemG,
  subatividadeParaFormularioRcaListagemG,
} from './rca-listagem-g-registry';

function deepCloneRecord<T>(value: T | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

export type RcaListagemGProjectPrefillResult = Partial<RcaListagemGFormValues>;

export function prefillRcaListagemGFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): RcaListagemGProjectPrefillResult {
  const projectRecord = project as Record<string, unknown>;
  const subActivityRaw = projectRecord.subActivity as string | undefined;
  const codigoDn = extrairCodigoDnDoProjectG(projectRecord);
  const formularioTipo = inferirFormularioRcaListagemG(subActivityRaw, codigoDn);
  const subActivity =
    subActivityRaw?.trim() || subatividadeParaFormularioRcaListagemG(formularioTipo);

  return {
    listagemCode: 'G',
    activity: RCA_LISTAGEM_G_ACTIVITY,
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
    listagemG: deepCloneRecord(projectRecord.listagemG as Record<string, unknown>) ?? {},
    geographicLocation: deepCloneRecord(project.geographicLocation),
    restricoesLocacionais: deepCloneRecord(
      project.locationalRestrictions ?? projectRecord.locationalRestrictions,
    ),
    unidadesConservacao: deepCloneRecord(
      project.conservationUnit ?? projectRecord.conservationUnit,
    ),
  };
}

export function buildRcaListagemGProjectSnapshot(values: RcaListagemGFormValues) {
  return {
    projectId:
      (values.empreendimento as { projectId?: string } | undefined)?.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemG: values.listagemG ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializeRcaListagemGForFirestore(
  values: RcaListagemGFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const termo = values.termoReferencia as
    | { dataEmissao?: Date | string; titulo?: string; processo?: string; versao?: string }
    | undefined;
  const payload: Record<string, unknown> = {
    ...values,
    status,
    listagemCode: 'G',
    formularioTipo: normalizarFormularioTipoRcaListagemG(values.formularioTipo),
    formSource: values.formSource ?? 'react',
    termoReferencia: {
      ...termo,
      dataEmissao: termo?.dataEmissao
        ? new Date(termo.dataEmissao).toISOString()
        : null,
    },
  };

  if (status === 'Aprovado') {
    payload.projectSnapshot = buildRcaListagemGProjectSnapshot(values);
  }

  return payload;
}
