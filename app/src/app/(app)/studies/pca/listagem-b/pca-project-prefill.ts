import type { Empreendedor, Project } from '@/lib/types';
import type { PcaListagemBFormValues } from './pca-listagem-b-schema';
import {
  extrairCodigoDnDoProjectB,
  inferirFormularioPcaListagemB,
  inferirSubatividadePcaListagemB,
} from './pca-listagem-b-registry';
import { PCA_LISTAGEM_B_ACTIVITY } from '@/lib/pca/pca-listagem-b-catalog';
import {
  formatCoordenadasProject,
  shouldPrefillPcaFromProject,
  cloneProjectListagemBlock,
  enrichPcaGeographicLocationForFirestore,
} from '../lib/pca-prefill-shared';

export type PcaListagemBProjectPrefillResult = Partial<PcaListagemBFormValues>;

export function prefillPcaListagemBFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): PcaListagemBProjectPrefillResult {
  const projectRecord = project as Record<string, unknown>;
  const codigoDn = extrairCodigoDnDoProjectB(projectRecord);
  const formularioTipo = inferirFormularioPcaListagemB(codigoDn);
  const subActivity = inferirSubatividadePcaListagemB(
    (project as Record<string, unknown>).subActivity as string | undefined,
    codigoDn,
  );

  const faseRaw = (projectRecord.listagemB as Record<string, unknown> | undefined)
    ?.regularizacaoAmbiental as Record<string, unknown> | undefined;
  const faseLic = faseRaw?.fase as string | undefined;

  return {
    listagemCode: 'B',
    activity: PCA_LISTAGEM_B_ACTIVITY,
    subActivity,
    formularioTipo,
    empreendimento: {
      projectId: project.id,
      nome: project.fantasyName || project.propertyName || '',
      municipio: project.municipio ?? '',
      endereco: project.address ?? '',
      coordenadas: formatCoordenadasProject(project),
      atividade: project.activity ?? PCA_LISTAGEM_B_ACTIVITY,
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
    listagemB: cloneProjectListagemBlock(projectRecord, 'listagemB'),
  };
}

export function buildPcaListagemBProjectSnapshot(values: PcaListagemBFormValues) {
  return {
    projectId: values.empreendimento.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemB: values.listagemB ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializePcaListagemBForFirestore(
  values: PcaListagemBFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const enriched = enrichPcaGeographicLocationForFirestore(
    values as Record<string, unknown>,
  ) as PcaListagemBFormValues;
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
    payload.projectSnapshot = buildPcaListagemBProjectSnapshot(enriched);
  }

  return payload;
}

export { shouldPrefillPcaFromProject as shouldPrefillFromProject };
