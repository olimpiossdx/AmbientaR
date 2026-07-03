import type { Empreendedor, Project } from '@/lib/types';
import type { PcaListagemFFormValues } from './pca-listagem-f-schema';
import {
  extrairCodigoDnDoProjectF,
  inferirFormularioPcaListagemF,
  inferirSubatividadePcaListagemF,
} from './pca-listagem-f-registry';
import { PCA_LISTAGEM_F_ACTIVITY } from '@/lib/pca/pca-listagem-f-catalog';
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

export function prefillPcaListagemFFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): Partial<PcaListagemFFormValues> {
  const projectRecord = project as Record<string, unknown>;
  const codigoDn = extrairCodigoDnDoProjectF(projectRecord);
  const formularioTipo = inferirFormularioPcaListagemF(codigoDn);
  const subActivity = inferirSubatividadePcaListagemF(
    projectRecord.subActivity as string | undefined,
    codigoDn,
  );

  const faseRaw = (projectRecord.listagemF as Record<string, unknown> | undefined)
    ?.regularizacaoAmbiental as Record<string, unknown> | undefined;
  const faseLic = faseRaw?.fase as string | undefined;

  return {
    listagemCode: 'F',
    activity: PCA_LISTAGEM_F_ACTIVITY,
    subActivity,
    formularioTipo,
    empreendimento: {
      projectId: project.id,
      nome: project.fantasyName || project.propertyName || '',
      municipio: project.municipio ?? '',
      endereco: project.address ?? '',
      coordenadas: formatCoordenadasProject(project),
      atividade: project.activity ?? PCA_LISTAGEM_F_ACTIVITY,
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
    listagemF: cloneProjectListagemBlock(projectRecord, 'listagemF'),
  };
}

export function buildPcaListagemFProjectSnapshot(values: PcaListagemFFormValues) {
  return {
    projectId: values.empreendimento.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemF: values.listagemF ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializePcaListagemFForFirestore(
  values: PcaListagemFFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const enriched = enrichPcaGeographicLocationForFirestore(
    values as Record<string, unknown>,
  ) as PcaListagemFFormValues;
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
    payload.projectSnapshot = buildPcaListagemFProjectSnapshot(enriched);
  }

  return payload;
}

export { shouldPrefillPcaFromProject as shouldPrefillFromProject };
