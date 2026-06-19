import { z } from 'zod';
import { PCA_LISTAGEM_E_ACTIVITY } from '@/lib/pca/pca-listagem-e-catalog';
import { createDefaultTrechoCoordinateBlock } from '@/lib/coordinates';

const termoReferenciaSchema = z.object({
  titulo: z.string().min(1, 'O título é obrigatório.'),
  processo: z.string().min(1, 'O processo é obrigatório.'),
  dataEmissao: z.date({ required_error: 'A data de emissão é obrigatória.' }),
  versao: z.string().optional(),
});

const empreendedorSchema = z.object({
  clientId: z.string().optional(),
  nome: z.string().min(1, 'O nome do empreendedor é obrigatório.'),
  cpfCnpj: z.string().min(1, 'O CPF/CNPJ é obrigatório.'),
  endereco: z.string().min(1, 'O endereço é obrigatório.'),
  contato: z.string().min(1, 'O contato é obrigatório.'),
});

const empreendimentoSchema = z.object({
  projectId: z.string().optional(),
  nome: z.string().min(1, 'O nome do empreendimento é obrigatório.'),
  municipio: z.string().min(1, 'O município é obrigatório.'),
  endereco: z.string().min(1, 'O endereço é obrigatório.'),
  coordenadas: z.string().optional(),
  atividade: z.string().optional(),
  tipologia: z.string().optional(),
  faseLicenciamento: z.enum(['LP', 'LI', 'LO', 'AAF', 'Outra']).optional(),
  codigoDn: z.string().optional(),
});

const objetoEstudoSchema = z.object({
  objeto: z.string().min(1, 'O objeto do estudo é obrigatório.'),
  fundamentacaoLegal: z.string().min(1, 'A fundamentação legal é obrigatória.'),
});

const conteudoEstudoSchema = z.object({
  introducao: z.string().optional(),
  caracterizacaoEmpreendimento: z.string().optional(),
  diagnosticoMeioFisico: z.string().optional(),
  diagnosticoMeioBiotico: z.string().optional(),
  diagnosticoMeioSocioeconomico: z.string().optional(),
  analiseImpactos: z.string().optional(),
  medidasMitigadoras: z.string().optional(),
  programasAmbientais: z.string().optional(),
  conclusao: z.string().optional(),
  referencias: z.string().optional(),
  anexos: z.string().optional(),
});

const equipeTecnicaSchema = z.object({
  qualificacoes: z.string().optional(),
  arts: z.string().optional(),
});

/** Bloco técnico PCA Listagem E — espelha cadastro empreendimento (listagemE.*, geoTrecho.inicio/fim). */
export const pcaListagemETecnicoSchema = z.any().optional();

export const pcaListagemEFormSchema = z
  .object({
  status: z.enum(['Rascunho', 'Aprovado']).optional(),
  listagemCode: z.literal('E'),
  activity: z.string().min(1),
  subActivity: z.string().min(1, 'Selecione a subatividade.'),
  formularioTipo: z.enum(['geral', 'dutos_gasodutos']),
  formSource: z.enum(['react', 'dynamic']).optional(),
  termoReferencia: termoReferenciaSchema,
  empreendedor: empreendedorSchema,
  empreendimento: empreendimentoSchema,
  objetoEstudo: objetoEstudoSchema,
  conteudoEstudo: conteudoEstudoSchema,
  equipeTecnica: equipeTecnicaSchema,
  listagemE: pcaListagemETecnicoSchema,
}).passthrough();

export type PcaListagemEFormValues = z.infer<typeof pcaListagemEFormSchema>;

export function getPcaListagemEDefaultValues(
  partial?: Partial<PcaListagemEFormValues> | null,
): PcaListagemEFormValues {
  return {
    status: 'Rascunho',
    listagemCode: 'E',
    activity: partial?.activity || PCA_LISTAGEM_E_ACTIVITY,
    subActivity: partial?.subActivity ?? '',
    formularioTipo: partial?.formularioTipo ?? 'dutos_gasodutos',
    formSource: 'react',
    termoReferencia: {
      titulo: partial?.termoReferencia?.titulo ?? '',
      processo: partial?.termoReferencia?.processo ?? '',
      versao: partial?.termoReferencia?.versao ?? '',
      dataEmissao: partial?.termoReferencia?.dataEmissao
        ? new Date(partial.termoReferencia.dataEmissao as string | Date)
        : new Date(),
    },
    empreendedor: {
      nome: '',
      cpfCnpj: '',
      endereco: '',
      contato: '',
      ...partial?.empreendedor,
    },
    empreendimento: {
      nome: '',
      municipio: '',
      endereco: '',
      coordenadas: '',
      ...partial?.empreendimento,
    },
    objetoEstudo: {
      objeto: 'Plano de Controle Ambiental (PCA)',
      fundamentacaoLegal: '',
      ...partial?.objetoEstudo,
    },
    conteudoEstudo: {
      introducao: '',
      caracterizacaoEmpreendimento: '',
      diagnosticoMeioFisico: '',
      diagnosticoMeioBiotico: '',
      diagnosticoMeioSocioeconomico: '',
      analiseImpactos: '',
      medidasMitigadoras: '',
      programasAmbientais: '',
      conclusao: '',
      referencias: '',
      anexos: '',
      ...partial?.conteudoEstudo,
    },
    equipeTecnica: {
      qualificacoes: '',
      arts: '',
      ...partial?.equipeTecnica,
    },
    listagemE: {
      ...(partial?.listagemE ?? {}),
      geoTrecho: {
        ...(partial?.listagemE?.geoTrecho ?? {}),
        inicio: {
          ...createDefaultTrechoCoordinateBlock(),
          ...((partial?.listagemE?.geoTrecho as { inicio?: object } | undefined)?.inicio),
        },
        fim: {
          ...createDefaultTrechoCoordinateBlock(),
          ...((partial?.listagemE?.geoTrecho as { fim?: object } | undefined)?.fim),
        },
      },
    },
  };
}
