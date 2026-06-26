import type { Empreendedor, Project } from '@/lib/types';
import type { PcaListagemDFormValues } from './pca-listagem-d-schema';
import {
  extrairCodigoDnDoProjectD,
  inferirFormularioPcaListagemD,
  inferirSubatividadePcaListagemD,
} from './pca-listagem-d-registry';
import { PCA_LISTAGEM_D_ACTIVITY } from '@/lib/pca/pca-listagem-d-catalog';
import {
  formatCoordenadasProject,
  shouldPrefillPcaFromProject,
  cloneProjectListagemBlock,
  enrichPcaGeographicLocationForFirestore,
} from '../lib/pca-prefill-shared';

function str(value: unknown): string {
  if (value == null || value === '') return '';
  return String(value);
}

export function prefillPcaListagemDFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): Partial<PcaListagemDFormValues> {
  const projectRecord = project as Record<string, unknown>;
  const codigoDn = extrairCodigoDnDoProjectD(projectRecord);
  const formularioTipo = inferirFormularioPcaListagemD(codigoDn);
  const subActivity = inferirSubatividadePcaListagemD(
    projectRecord.subActivity as string | undefined,
    codigoDn,
  );

  const faseRaw = (projectRecord.listagemD as Record<string, unknown> | undefined)
    ?.regularizacaoAmbiental as Record<string, unknown> | undefined;
  const faseLic = faseRaw?.fase as string | undefined;

  return {
    listagemCode: 'D',
    activity: PCA_LISTAGEM_D_ACTIVITY,
    subActivity,
    formularioTipo,
    empreendimento: {
      projectId: project.id,
      nome: project.fantasyName || project.propertyName || '',
      municipio: project.municipio ?? '',
      endereco: project.address ?? '',
      coordenadas: formatCoordenadasProject(project),
      atividade: project.activity ?? PCA_LISTAGEM_D_ACTIVITY,
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
    listagemD: cloneProjectListagemBlock(projectRecord, 'listagemD'),
  };
}

export function buildPcaListagemDProjectSnapshot(values: PcaListagemDFormValues) {
  return {
    projectId: values.empreendimento.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemD: values.listagemD ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializePcaListagemDForFirestore(
  values: PcaListagemDFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const enriched = enrichPcaGeographicLocationForFirestore(
    values as Record<string, unknown>,
  ) as PcaListagemDFormValues;
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
    payload.projectSnapshot = buildPcaListagemDProjectSnapshot(enriched);
  }

  return payload;
}

export { shouldPrefillPcaFromProject as shouldPrefillFromProject };
