import { z } from 'zod';
import { PCA_LISTAGEM_E_ACTIVITY } from '@/lib/pca/pca-listagem-e-catalog';

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

export const pcaListagemETecnicoSchema = z
  .object({
    regularizacaoAmbiental: z
      .object({
        fase: z.string().optional(),
        classe: z.string().optional(),
        processoUltimaLicenca: z.string().optional(),
      })
      .optional(),
    atividadesPrincipal: z
      .array(
        z.object({
          atividade: z.string().optional(),
          codigo: z.string().optional(),
          quantidade: z.string().optional(),
        }),
      )
      .optional(),
    geoTrecho: z
      .object({
        extensaoKm: z.string().optional(),
        municipiosAtendidos: z.string().optional(),
        resumoCoordenadas: z.string().optional(),
      })
      .optional(),
    legislacaoMunicipal: z
      .object({
        temPlanoDiretor: z.boolean().optional(),
        interfereNucleos: z.boolean().optional(),
        resumoNucleos: z.string().optional(),
      })
      .optional(),
    caracterizacaoTecnica: z
      .object({
        vazaoNormal: z.string().optional(),
        vazaoMaxima: z.string().optional(),
        pressaoOperacao: z.string().optional(),
        vidaUtilAnos: z.string().optional(),
        linhaTronco: z.string().optional(),
        produtosResumo: z.string().optional(),
      })
      .optional(),
    recursosHidricos: z
      .object({
        intervencaoCursosAgua: z.boolean().optional(),
        resumoCorpos: z.string().optional(),
        observacoes: z.string().optional(),
      })
      .optional(),
    supressaoVegetacao: z
      .object({
        necessaria: z.boolean().optional(),
        areaHa: z.string().optional(),
        resumo: z.string().optional(),
      })
      .optional(),
    efluentes: z
      .object({
        resumoTratamento: z.string().optional(),
        resumoTipologias: z.string().optional(),
      })
      .optional(),
    residuos: z
      .object({
        resumoGestao: z.string().optional(),
      })
      .optional(),
    emissoes: z
      .object({
        resumoControle: z.string().optional(),
      })
      .optional(),
  })
  .optional();

export const pcaListagemEFormSchema = z.object({
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
});

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
    listagemE: partial?.listagemE ?? {},
  };
}
