import type { Empreendedor, Project } from '@/lib/types';
import type { PcaListagemCFormValues } from './pca-listagem-c-schema';
import {
  extrairCodigoDnDoProjectC,
  inferirFormularioPcaListagemC,
  inferirSubatividadePcaListagemC,
} from './pca-listagem-c-registry';
import { PCA_LISTAGEM_C_ACTIVITY } from '@/lib/pca/pca-listagem-c-catalog';
import {
  formatCoordenadasProject,
  shouldPrefillPcaFromProject,
  cloneProjectListagemBlock,
  enrichPcaGeographicLocationForFirestore,
} from '../lib/pca-prefill-shared';

export function prefillPcaListagemCFromProject(
  project: Project,
  empreendedor?: Empreendedor | null,
): Partial<PcaListagemCFormValues> {
  const projectRecord = project as Record<string, unknown>;
  const codigoDn = extrairCodigoDnDoProjectC(projectRecord);
  const formularioTipo = inferirFormularioPcaListagemC(codigoDn);
  const subActivity = inferirSubatividadePcaListagemC(
    projectRecord.subActivity as string | undefined,
    codigoDn,
  );

  const faseRaw = (projectRecord.listagemC as Record<string, unknown> | undefined)
    ?.regularizacaoAmbiental as Record<string, unknown> | undefined;
  const faseLic = faseRaw?.fase as string | undefined;

  return {
    listagemCode: 'C',
    activity: PCA_LISTAGEM_C_ACTIVITY,
    subActivity,
    formularioTipo,
    empreendimento: {
      projectId: project.id,
      nome: project.fantasyName || project.propertyName || '',
      municipio: project.municipio ?? '',
      endereco: project.address ?? '',
      coordenadas: formatCoordenadasProject(project),
      atividade: project.activity ?? PCA_LISTAGEM_C_ACTIVITY,
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
    listagemC: cloneProjectListagemBlock(projectRecord, 'listagemC'),
  };
}

export function buildPcaListagemCProjectSnapshot(values: PcaListagemCFormValues) {
  return {
    projectId: values.empreendimento.projectId ?? null,
    listagemCode: values.listagemCode,
    subActivity: values.subActivity,
    formularioTipo: values.formularioTipo,
    listagemC: values.listagemC ?? {},
    empreendimento: values.empreendimento,
    snapshotAt: new Date().toISOString(),
  };
}

export function serializePcaListagemCForFirestore(
  values: PcaListagemCFormValues,
  status: 'Rascunho' | 'Aprovado',
) {
  const enriched = enrichPcaGeographicLocationForFirestore(
    values as Record<string, unknown>,
  ) as PcaListagemCFormValues;
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
    payload.projectSnapshot = buildPcaListagemCProjectSnapshot(enriched);
  }

  return payload;
}

export { shouldPrefillPcaFromProject as shouldPrefillFromProject };
