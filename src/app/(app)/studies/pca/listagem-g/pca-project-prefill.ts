import type { Empreendedor, Project } from '@/lib/types';
import type { PcaListagemGFormValues } from './pca-listagem-g-schema';
import {
  extrairCodigoDnDoProjectG,
  inferirFormularioPcaListagemG,
  inferirSubatividadePcaListagemG,
} from './pca-listagem-g-registry';
import { PCA_LISTAGEM_G_ACTIVITY } from '@/lib/pca/pca-listagem-g-catalog';
import {
  formatCoordenadasProject,
  shouldPrefillPcaFromProject,
  cloneProjectListagemBlock,
  deepCloneRecord,
  enrichPcaGeographicLocationForFirestore,
} from '../lib/pca-prefill-shared';

function str(value: unknown): string {
  if (value == null || value === '') return '';
  return String(value);
}

export function prefillPcaListagemGFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): Partial<PcaListagemGFormValues> {
  const projectRecord = project as Record<string, unknown>;
  const codigoDn = extrairCodigoDnDoProjectG(projectRecord);
  const formularioTipo = inferirFormularioPcaListagemG(codigoDn);
  const subActivity = inferirSubatividadePcaListagemG(
    projectRecord.subActivity as string | undefined,
  );

  const listagemG = projectRecord.listagemG as Record<string, unknown> | undefined;
  const faseRaw = (listagemG?.regularizacaoAmbiental ??
    (listagemG?.geral as Record<string, unknown> | undefined)?.licenciamento) as
    | Record<string, unknown>
    | undefined;
  const faseLic = faseRaw?.fase as string | undefined;

  return {
    listagemCode: 'G',
    activity: PCA_LISTAGEM_G_ACTIVITY,
    subActivity,
    formularioTipo,
    empreendimento: {
      projectId: project.id,
      nome: project.fantasyName || project.propertyName || '',
      municipio: project.municipio ?? '',
      endereco: project.address ?? '',
      coordenadas: formatCoordenadasProject(project),
      atividade: project.activity ?? PCA_LISTAGEM_G_ACTIVITY,
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
    listagemG: cloneProjectListagemBlock(projectRecord, 'listagemG'),
    geographicLocation: deepCloneRecord(project.geographicLocation),
  };
}

export function buildPcaListagemGProjectSnapshot(values: PcaListagemGFormValues) {
  return {
    projectId: values.empreendimento.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemG: values.listagemG ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializePcaListagemGForFirestore(
  values: PcaListagemGFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const enriched = enrichPcaGeographicLocationForFirestore(
    values as Record<string, unknown>,
  ) as PcaListagemGFormValues;
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
    payload.projectSnapshot = buildPcaListagemGProjectSnapshot(enriched);
  }

  return payload;
}

export { shouldPrefillPcaFromProject as shouldPrefillFromProject };
