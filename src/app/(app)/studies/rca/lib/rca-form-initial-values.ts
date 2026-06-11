import _ from 'lodash';
import type { RCA } from '@/lib/types';
import { RCA_LISTAGEM_A_ACTIVITY } from '@/lib/rca/rca-listagem-a-catalog';
import { RCA_LISTAGEM_B_ACTIVITY } from '@/lib/rca/rca-listagem-b-catalog';
import { RCA_LISTAGEM_C_ACTIVITY } from '@/lib/rca/rca-listagem-c-catalog';
import { RCA_LISTAGEM_D_ACTIVITY } from '@/lib/rca/rca-listagem-d-catalog';
import { RCA_LISTAGEM_E_ACTIVITY } from '@/lib/rca/rca-listagem-e-catalog';
import { RCA_LISTAGEM_F_ACTIVITY } from '@/lib/rca/rca-listagem-f-catalog';
import { RCA_LISTAGEM_G_ACTIVITY } from '@/lib/rca/rca-listagem-g-catalog';
import { RCA_LISTAGEM_H_ACTIVITY } from '@/lib/rca/rca-listagem-h-catalog';

export type RcaFormValues = Record<string, unknown> & {
  activity?: string;
  subActivity?: string;
  status?: string;
  listagemCode?: string;
  formularioTipo?: string;
  formSource?: string;
  termoReferencia?: {
    titulo?: string;
    processo?: string;
    dataEmissao?: Date | string;
    versao?: string;
  };
};

export function getRcaDefaultValues(): RcaFormValues {
  return {
    activity: '',
    subActivity: '',
    status: 'Rascunho',
    formSource: 'react',
    termoReferencia: { titulo: '', processo: '', dataEmissao: new Date(), versao: '' },
    empreendedor: {
      clientId: '',
      nome: '',
      cpfCnpj: '',
      identidade: '',
      orgaoExpedidor: '',
      uf: '',
      endereco: '',
      caixaPostal: '',
      municipio: '',
      distrito: '',
      cep: '',
      ddd: '',
      fone: '',
      fax: '',
      email: '',
      tipoPessoa: 'Pessoa Jurídica',
      cadastroProdutorRural: '',
      condicao: 'Proprietário',
      cargo: '',
    },
    empreendimento: {
      projectId: '',
      nome: '',
      inscricaoIncra: '',
      nomeFantasia: '',
      cnpj: '',
      zonaRural: 'Não',
      endereco: '',
      caixaPostal: '',
      municipio: '',
      distrito: '',
      uf: '',
      cep: '',
      ddd: '',
      fone: '',
      fax: '',
      email: '',
      inscricaoEstadual: '',
      inscricaoMunicipal: '',
      correspondenceIsSame: true,
      correspondenceAddress: '',
      correspondenceCaixaPostal: '',
      correspondenceMunicipio: '',
      correspondenceUf: '',
      correspondenceCep: '',
      correspondenceDdd: '',
      correspondenceFone: '',
      correspondenceFax: '',
      correspondenceEmail: '',
    },
    responsavelAmbiental: {
      nome: '',
      cpf: '',
      registroConselho: '',
      art: '',
      endereco: '',
      caixaPostal: '',
      municipio: '',
      distrito: '',
      uf: '',
      cep: '',
      ddd: '',
      fone: '',
      fax: '',
      email: '',
    },
    responsaveisEstudo: {
      empresa: { name: '', fantasyName: '', cnpj: '' },
      tecnicos: [{ name: '', cpf: '' }],
      outrosProfissionais: [],
    },
    geographicLocation: {
      datum: 'SAD-69',
      format: 'Lat/Long',
      latLong: {
        lat: { grau: '', min: '', seg: '' },
        long: { grau: '', min: '', seg: '' },
      },
      utm: { x: '', y: '', fuso: '23' },
      local: '',
      hydrographicBasin: '',
      upgrh: '',
      nearestWaterCourse: '',
    },
    atividades: [{}],
    faseRegularizacao: { isAmpliacao: false, processoAnterior: '', fase: 'LI', classe: '' },
    agendaVerde: { fazUso: false },
    agendaAzul: { usaConcessionaria: false, concessionaria: '', fazUsoAutorizacao: false },
    restricoesLocacionais: {
      biome: undefined,
      biomeOutro: '',
      hasNativeVegetation: false,
      nativeVegetation: [],
      nativeVegetationOther: '',
      inPermanentPreservationArea: false,
      propertyHasPermanentPreservationArea: false,
      isPermanentPreservationAreaPreserved: false,
      isPermanentPreservationAreaProtected: false,
      inKarstArea: false,
      inFluvialLacustrineArea: false,
    },
    unidadesConservacao: { dentroOuRaio10km: false, distancia: '', nomeUC: '', orgaoGestor: '' },
    criteriosDN130: {
      possuiRPPN: false,
      areaAntropizadaConsolidada: false,
      compromissos: [],
      adotaSistemasReducaoVulnerabilidade: false,
      sistemasReducaoDescricao: '',
      usaQueimaCana: false,
      praticasDesenvolvidas: [],
    },
    recursosHumanos: {
      fixos: 0,
      temporarios: 0,
      terceirizados: 0,
      producao: 0,
      administrativo: 0,
      manutencao: 0,
    },
    regimeOperacao: {
      horasDia: 0,
      diasSemana: 0,
      turnos: 0,
      trabalhadoresTurno: 0,
      sazonalidade: false,
      sazonalidadeDescricao: '',
    },
    capacidadeInstalada: 0,
    consumoMateriaPrima: 0,
    producaoNominal: '',
    materiasPrimas: [],
    equipamentosProducao: [],
    equipamentosCalor: [],
    residuosSolidos: [],
    produtos: [],
    produtosFabricados: [],
    equipamentos: [],
    capacidade: {},
    trabalhadores: {},
    areaEmpreendimento: {
      total: 0,
      construida: 0,
      explorada: 0,
      preservada: 0,
      destinada: 0,
      corposDagua: '',
      interesseHistorico: false,
      interesseCenico: false,
      interesseCultural: false,
      interesseCientifico: false,
      interesseNatural: false,
    },
    analiseSolo: [],
    atividadesAgricolas: { olericultura: [], culturasAnuais: [], culturasPerenes: [] },
    irrigacao: [],
    atividadesFlorestais: { silvicultura: [], carvoejamento: [] },
    atividadesAgropecuarias: [],
    outrasAtividades: [],
    infraestrutura: [],
    insumos: [],
    manutencaoEquipamentos: '',
    destinoEfluentesLavador: [],
    destinoResiduosLavador: [],
    destinoEfluentesAgricolas: [],
    destinoEmbalagensAgrotoxicos: [],
    efluentesDomesticos: [],
    residuosDomesticos: [],
    destinoEfluentesAgropecuarios: [],
    destinoResiduosAgropecuarios: [],
    destinoRestosAnimais: [],
    queimaAgricola: [],
    retornoLavouras: [],
    fertirrigacao: [],
    compostagem: [],
    tratamentoEfluentes: [],
    outrosDestinosEfluentes: '',
    reciclagemEmbalagens: '',
    tripliceLavagem: '',
    incineracaoEmbalagens: '',
    outrosDestinosEmbalagens: '',
    impactosAmbientais: [],
    diagnosticoAPPeRL: { localizacao: '', estadoConservacao: 'Inicial' },
    analiseViabilidadeLocacional: [],
    impactosMeioFisico: [],
    impactosMeioBiotico: [],
    impactosMeioSocioeconomico: [],
    zeeGeofisico: {},
    zeeSocioeconomico: [],
    anexos: [],
    anexosOutros: '',
    usoMadeira: { consome: false, possuiRegistroIEF: false },
    capacidadeEstocagem: { cotaMaxima: 0, percentualMedio: 0 },
    processoProdutivo: { descricao: '' },
    reatores: [],
    efluentesHidricosReatores: [],
    emissoesResiduosReatores: [],
    listagemA: {},
    listagemB: {},
    listagemC: {},
    listagemD: {},
    listagemE: {},
    listagemF: {},
    listagemG: {},
    listagemH: {},
  };
}

export function getRcaInitialValues(currentItem?: RCA | null): RcaFormValues {
  const defaults = getRcaDefaultValues();

  if (!currentItem) {
    return defaults;
  }

  const merged = _.merge({}, defaults, currentItem) as RcaFormValues;

  if (currentItem.termoReferencia?.dataEmissao) {
    merged.termoReferencia = {
      ...(merged.termoReferencia || {}),
      dataEmissao: new Date(currentItem.termoReferencia.dataEmissao),
    };
  }

  return merged;
}

export function getRcaListagemAInitialValues(currentItem?: RCA | null): RcaFormValues {
  const base = getRcaInitialValues(currentItem);
  return {
    ...base,
    listagemCode: 'A',
    activity: base.activity || RCA_LISTAGEM_A_ACTIVITY,
  };
}

export function getRcaListagemBInitialValues(currentItem?: RCA | null): RcaFormValues {
  const base = getRcaInitialValues(currentItem);
  return {
    ...base,
    listagemCode: 'B',
    activity: base.activity || RCA_LISTAGEM_B_ACTIVITY,
  };
}

export function getRcaListagemCInitialValues(currentItem?: RCA | null): RcaFormValues {
  const base = getRcaInitialValues(currentItem);
  return {
    ...base,
    listagemCode: 'C',
    activity: base.activity || RCA_LISTAGEM_C_ACTIVITY,
  };
}

export function getRcaListagemDInitialValues(currentItem?: RCA | null): RcaFormValues {
  const base = getRcaInitialValues(currentItem);
  return {
    ...base,
    listagemCode: 'D',
    activity: base.activity || RCA_LISTAGEM_D_ACTIVITY,
  };
}

export function getRcaListagemEInitialValues(currentItem?: RCA | null): RcaFormValues {
  const base = getRcaInitialValues(currentItem);
  return {
    ...base,
    listagemCode: 'E',
    activity: base.activity || RCA_LISTAGEM_E_ACTIVITY,
  };
}

export function getRcaListagemFInitialValues(currentItem?: RCA | null): RcaFormValues {
  const base = getRcaInitialValues(currentItem);
  return {
    ...base,
    listagemCode: 'F',
    activity: base.activity || RCA_LISTAGEM_F_ACTIVITY,
  };
}

export function getRcaListagemGInitialValues(currentItem?: RCA | null): RcaFormValues {
  const base = getRcaInitialValues(currentItem);
  return {
    ...base,
    listagemCode: 'G',
    activity: base.activity || RCA_LISTAGEM_G_ACTIVITY,
  };
}

export function getRcaListagemHInitialValues(currentItem?: RCA | null): RcaFormValues {
  const base = getRcaInitialValues(currentItem);
  return {
    ...base,
    listagemCode: 'H',
    activity: base.activity || RCA_LISTAGEM_H_ACTIVITY,
  };
}
