import type { Empreendedor, Project } from '@/lib/types';

import type { PcaListagemHFormValues } from './pca-listagem-h-schema';

import {

  extrairCodigoDnDoProjectH,

  inferirFormularioPcaListagemH,

  inferirSubatividadePcaListagemH,

} from './pca-listagem-h-registry';

import { PCA_LISTAGEM_H_ACTIVITY } from '@/lib/pca/pca-listagem-h-catalog';

import {
  formatCoordenadasProject,
  shouldPrefillPcaFromProject,
  cloneProjectListagemBlock,
} from '../lib/pca-prefill-shared';



function str(value: unknown): string {

  if (value == null || value === '') return '';

  return String(value);

}





export function prefillPcaListagemHFromProject(

  project: Project,

  empreendedor?: Empreendedor | null,

): Partial<PcaListagemHFormValues> {

  const projectRecord = project as Record<string, unknown>;

  const codigoDn = extrairCodigoDnDoProjectH(projectRecord);

  const formularioTipo = inferirFormularioPcaListagemH(codigoDn);

  const subActivity = inferirSubatividadePcaListagemH(

    projectRecord.subActivity as string | undefined,

  );



  const listagemH = projectRecord.listagemH as Record<string, unknown> | undefined;

  const lic = (listagemH?.geral as Record<string, unknown> | undefined)?.licenciamento as

    | Record<string, unknown>

    | undefined;

  const faseLic = lic?.fase as string | undefined;



  return {

    listagemCode: 'H',

    activity: PCA_LISTAGEM_H_ACTIVITY,

    subActivity,

    formularioTipo,

    empreendimento: {

      projectId: project.id,

      nome: project.fantasyName || project.propertyName || '',

      municipio: project.municipio ?? '',

      endereco: project.address ?? '',

      coordenadas: formatCoordenadasProject(project),

      atividade: project.activity ?? PCA_LISTAGEM_H_ACTIVITY,

      tipologia: String(lic?.classe ?? ''),

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

    listagemH: cloneProjectListagemBlock(projectRecord, 'listagemH'),

  };

}



export function buildPcaListagemHProjectSnapshot(values: PcaListagemHFormValues) {

  return {

    projectId: values.empreendimento.projectId ?? null,

    listagemCode: values.listagemCode,

    subActivity: values.subActivity,

    formularioTipo: values.formularioTipo,

    listagemH: values.listagemH ?? {},

    empreendimento: values.empreendimento,

    snapshotAt: new Date().toISOString(),

  };

}



export function serializePcaListagemHForFirestore(

  values: PcaListagemHFormValues,

  status: 'Rascunho' | 'Aprovado',

) {

  const payload: Record<string, unknown> = {

    ...values,

    status,

    formSource: values.formSource ?? 'react',

    termoReferencia: {

      ...values.termoReferencia,

      dataEmissao: values.termoReferencia.dataEmissao.toISOString(),

    },

  };



  if (status === 'Aprovado') {

    payload.projectSnapshot = buildPcaListagemHProjectSnapshot(values);

  }



  return payload;

}



export { shouldPrefillPcaFromProject as shouldPrefillFromProject };


