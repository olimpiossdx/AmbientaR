import type { Empreendedor, Project } from '@/lib/types';
import type { PcaListagemEFormValues } from './pca-listagem-e-schema';
import {
  extrairCodigoDnDoProjectE,
  inferirFormularioPcaListagemE,
  inferirSubatividadePcaListagemE,
} from './pca-listagem-e-registry';
import { PCA_LISTAGEM_E_ACTIVITY } from '@/lib/pca/pca-listagem-e-catalog';
import {
  formatCoordenadasProject,
  shouldPrefillPcaFromProject,
  cloneProjectListagemBlock,
} from '../lib/pca-prefill-shared';
import { enrichListagemEGeoTrechoWithDecimal } from '@/lib/coordinates';

function str(value: unknown): string {
  if (value == null || value === '') return '';
  return String(value);
}

export function prefillPcaListagemEFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): Partial<PcaListagemEFormValues> {
  const projectRecord = project as Record<string, unknown>;
  const codigoDn = extrairCodigoDnDoProjectE(projectRecord);
  const formularioTipo = inferirFormularioPcaListagemE(codigoDn);
  const subActivity = inferirSubatividadePcaListagemE(
    projectRecord.subActivity as string | undefined,
    codigoDn,
  );

  const faseRaw = (projectRecord.listagemE as Record<string, unknown> | undefined)
    ?.regularizacaoAmbiental as Record<string, unknown> | undefined;
  const faseLic = faseRaw?.fase as string | undefined;

  return {
    listagemCode: 'E',
    activity: PCA_LISTAGEM_E_ACTIVITY,
    subActivity,
    formularioTipo,
    empreendimento: {
      projectId: project.id,
      nome: project.fantasyName || project.propertyName || '',
      municipio: project.municipio ?? '',
      endereco: project.address ?? '',
      coordenadas: formatCoordenadasProject(project),
      atividade: project.activity ?? PCA_LISTAGEM_E_ACTIVITY,
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
    listagemE: cloneProjectListagemBlock(projectRecord, 'listagemE'),
  };
}

export function buildPcaListagemEProjectSnapshot(values: PcaListagemEFormValues) {
  return {
    projectId: values.empreendimento.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemE: values.listagemE ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializePcaListagemEForFirestore(
  values: PcaListagemEFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const enriched = enrichListagemEGeoTrechoWithDecimal(values);
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
    payload.projectSnapshot = buildPcaListagemEProjectSnapshot(enriched);
  }

  return payload;
}

export { shouldPrefillPcaFromProject as shouldPrefillFromProject };
