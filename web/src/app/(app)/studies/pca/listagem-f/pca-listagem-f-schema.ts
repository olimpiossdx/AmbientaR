import { z } from 'zod';
import { PCA_LISTAGEM_F_ACTIVITY } from '@/lib/pca/pca-listagem-f-catalog';

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

export const pcaListagemFTecnicoSchema = z
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
    postoRevendedor: z
      .object({
        quantidadeL: z.string().optional(),
        registroAnp: z.string().optional(),
      })
      .optional(),
    area: z
      .object({
        totalM2: z.string().optional(),
        construidaM2: z.string().optional(),
      })
      .optional(),
    tanques: z
      .object({
        resumo: z.string().optional(),
      })
      .optional(),
    bombas: z
      .object({
        resumo: z.string().optional(),
      })
      .optional(),
    sistemasControle: z
      .object({
        resumo: z.string().optional(),
      })
      .optional(),
    protecaoArmazenamento: z
      .object({
        pocosMonitoramento: z.boolean().optional(),
        metodosDeteccaoVazamento: z.string().optional(),
        protecaoCatodica: z.boolean().optional(),
      })
      .optional(),
    balancoHidrico: z
      .object({
        consumoTotal: z.string().optional(),
        efluenteCsao: z.string().optional(),
      })
      .optional(),
    efluentes: z
      .object({
        sanitariosDestino: z.string().optional(),
        industriaisResumo: z.string().optional(),
      })
      .optional(),
    residuos: z
      .object({
        resumoGestao: z.string().optional(),
      })
      .optional(),
    atividadesSecundarias: z
      .object({
        resumo: z.string().optional(),
      })
      .optional(),
  })
  .optional();

export const pcaListagemFFormSchema = z.object({
  status: z.enum(['Rascunho', 'Aprovado']).optional(),
  listagemCode: z.literal('F'),
  activity: z.string().min(1),
  subActivity: z.string().min(1, 'Selecione a subatividade.'),
  formularioTipo: z.enum(['geral', 'posto_combustivel']),
  formSource: z.enum(['react', 'dynamic']).optional(),
  termoReferencia: termoReferenciaSchema,
  empreendedor: empreendedorSchema,
  empreendimento: empreendimentoSchema,
  objetoEstudo: objetoEstudoSchema,
  conteudoEstudo: conteudoEstudoSchema,
  equipeTecnica: equipeTecnicaSchema,
  listagemF: pcaListagemFTecnicoSchema,
});

export type PcaListagemFFormValues = z.infer<typeof pcaListagemFFormSchema>;

export function getPcaListagemFDefaultValues(
  partial?: Partial<PcaListagemFFormValues> | null,
): PcaListagemFFormValues {
  return {
    status: 'Rascunho',
    listagemCode: 'F',
    activity: partial?.activity || PCA_LISTAGEM_F_ACTIVITY,
    subActivity: partial?.subActivity ?? '',
    formularioTipo: partial?.formularioTipo ?? 'posto_combustivel',
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
    listagemF: partial?.listagemF ?? {},
  };
}
