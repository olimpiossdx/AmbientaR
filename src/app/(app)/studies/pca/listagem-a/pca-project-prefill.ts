import type { Empreendedor, Project } from '@/lib/types';
import type { PcaListagemAFormValues } from './pca-listagem-a-schema';
import {
  extrairCodigoDnDoProject,
  inferirFormularioPcaListagemA,
  inferirSubatividadePcaListagemA,
  normalizarFormularioTipoPcaListagemA,
} from './pca-listagem-a-registry';
import { PCA_LISTAGEM_A_ACTIVITY } from '@/lib/pca/pca-listagem-a-catalog';
import {
  deepCloneRecord,
  enrichPcaGeographicLocationForFirestore,
  formatCoordenadasProject,
} from '../lib/pca-prefill-shared';

export type PcaProjectPrefillResult = Partial<PcaListagemAFormValues> & {
  conservationUnit?: Project['conservationUnit'];
  legalReserve?: Project['legalReserve'];
  locationalRestrictions?: Project['locationalRestrictions'];
};

/** Hidrata campos do PCA Listagem A a partir do cadastro do empreendimento (somente leitura). */
export function prefillPcaListagemAFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): PcaProjectPrefillResult {
  const projectRecord = project as Record<string, unknown>;
  const codigoDn = extrairCodigoDnDoProject(projectRecord);
  const subActivityRaw = (project as Record<string, unknown>).subActivity as string | undefined;
  const formularioTipo = inferirFormularioPcaListagemA(codigoDn, subActivityRaw);
  const subActivity = inferirSubatividadePcaListagemA(subActivityRaw, codigoDn);

  const faseRaw = (projectRecord.listagemA as Record<string, unknown> | undefined)
    ?.regularizacaoAmbiental as Record<string, unknown> | undefined;
  const faseLic = faseRaw?.fase as string | undefined;

  return {
    listagemCode: 'A',
    activity: PCA_LISTAGEM_A_ACTIVITY,
    subActivity,
    formularioTipo,
    empreendimento: {
      projectId: project.id,
      nome: project.fantasyName || project.propertyName || '',
      municipio: project.municipio ?? '',
      endereco: project.address ?? '',
      coordenadas: formatCoordenadasProject(project),
      atividade: project.activity ?? PCA_LISTAGEM_A_ACTIVITY,
      tipologia: String(faseRaw?.classe ?? ''),
      faseLicenciamento: ['LP', 'LI', 'LO', 'AAF', 'Outra'].includes(faseLic ?? '')
        ? (faseLic as 'LP' | 'LI' | 'LO' | 'AAF' | 'Outra')
        : undefined,
      codigoDn: codigoDn ?? undefined,
    },
    empreendedor: empreendedor
      ? {
          clientId: empreendedor.id,
          nome: empreendedor.name ?? '',
          cpfCnpj: empreendedor.cpfCnpj ?? '',
          endereco: empreendedor.address ?? '',
          contato: [empreendedor.phone, empreendedor.email].filter(Boolean).join(' / '),
        }
      : undefined,
    listagemA: deepCloneRecord(projectRecord.listagemA as Record<string, unknown>) ?? {},
    geographicLocation: deepCloneRecord(project.geographicLocation),
    conservationUnit: deepCloneRecord(
      project.conservationUnit ?? projectRecord.conservationUnit,
    ) as PcaProjectPrefillResult['conservationUnit'],
    legalReserve: deepCloneRecord(
      project.legalReserve ?? projectRecord.legalReserve,
    ) as PcaProjectPrefillResult['legalReserve'],
    locationalRestrictions: deepCloneRecord(
      project.locationalRestrictions ?? projectRecord.locationalRestrictions,
    ) as PcaProjectPrefillResult['locationalRestrictions'],
  };
}

export function buildPcaProjectSnapshot(values: PcaListagemAFormValues) {
  return {
    projectId: values.empreendimento.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemA: values.listagemA ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializePcaListagemAForFirestore(values: PcaListagemAFormValues, status: 'Rascunho' | 'Aprovado') {
  const enriched = enrichPcaGeographicLocationForFirestore(
    values as Record<string, unknown>,
  ) as PcaListagemAFormValues;
  const payload: Record<string, unknown> = {
    ...enriched,
    status,
    formSource: enriched.formSource ?? 'react',
    termoReferencia: {
      ...enriched.termoReferencia,
      dataEmissao: enriched.termoReferencia.dataEmissao.toISOString(),
    },
  };

  if (status === 'Aprovado') {
    payload.projectSnapshot = buildPcaProjectSnapshot(enriched);
  }

  return payload;
}

/** Em rascunho aprovado, usa snapshot; em rascunho vivo, permite prefill do project. */
export function shouldPrefillFromProject(
  status?: string,
  hasSnapshot?: boolean,
): boolean {
  if (status === 'Aprovado' && hasSnapshot) return false;
  return status !== 'Aprovado';
}
