import { z } from 'zod';
import { PCA_LISTAGEM_D_ACTIVITY } from '@/lib/pca/pca-listagem-d-catalog';

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

export const pcaListagemDTecnicoSchema = z
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
    areaEmpreendimento: z
      .object({
        areaTotalHa: z.string().optional(),
        areaUtilHa: z.string().optional(),
        areaPlantioCanaHa: z.string().optional(),
        areaConstruidaHa: z.string().optional(),
      })
      .optional(),
    trabalhadores: z
      .object({
        duranteSafra: z.string().optional(),
        foraSafra: z.string().optional(),
        periodoSafra: z.string().optional(),
      })
      .optional(),
    capacidadeInstalada: z
      .object({
        utilizacaoCachacaPct: z.string().optional(),
        utilizacaoEnvasePct: z.string().optional(),
        resumo: z.string().optional(),
      })
      .optional(),
    recursosHidricos: z
      .object({
        corpoReceptorEfluentes: z.string().optional(),
        classesCorpo: z.string().optional(),
        observacoesUsos: z.string().optional(),
      })
      .optional(),
    efluentes: z
      .object({
        geraVinaca: z.boolean().optional(),
        resumoTratamento: z.string().optional(),
        destinoVinaca: z.string().optional(),
      })
      .optional(),
    equipamentos: z
      .object({
        resumoMoendas: z.string().optional(),
        resumoEnvasadoras: z.string().optional(),
        resumoDecantadores: z.string().optional(),
      })
      .optional(),
  })
  .optional();

export const pcaListagemDFormSchema = z.object({
  status: z.enum(['Rascunho', 'Aprovado']).optional(),
  listagemCode: z.literal('D'),
  activity: z.string().min(1),
  subActivity: z.string().min(1, 'Selecione a subatividade.'),
  formularioTipo: z.enum(['geral', 'aguardenete_cana']),
  formSource: z.enum(['react', 'dynamic']).optional(),
  termoReferencia: termoReferenciaSchema,
  empreendedor: empreendedorSchema,
  empreendimento: empreendimentoSchema,
  objetoEstudo: objetoEstudoSchema,
  conteudoEstudo: conteudoEstudoSchema,
  equipeTecnica: equipeTecnicaSchema,
  listagemD: pcaListagemDTecnicoSchema,
});

export type PcaListagemDFormValues = z.infer<typeof pcaListagemDFormSchema>;

export function getPcaListagemDDefaultValues(
  partial?: Partial<PcaListagemDFormValues> | null,
): PcaListagemDFormValues {
  return {
    status: 'Rascunho',
    listagemCode: 'D',
    activity: partial?.activity || PCA_LISTAGEM_D_ACTIVITY,
    subActivity: partial?.subActivity ?? '',
    formularioTipo: partial?.formularioTipo ?? 'aguardenete_cana',
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
    listagemD: partial?.listagemD ?? {},
  };
}
