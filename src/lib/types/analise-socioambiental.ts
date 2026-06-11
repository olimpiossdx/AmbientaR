/**
 * Tipos para Extrato de Análise Socioambiental (relatórios no padrão Sicoob/AgroTools).
 * Permite gerar relatórios similares, preencher cadastro do cliente e reutilizar em estudos.
 */

/** Informações da propriedade/território (espelho do PDF) */
export type InformacoesPropriedade = {
  codigo?: string;
  nivel?: string;
  nome?: string;
  unidade?: string;
  areaInformadaHa?: number;
  areaCalculadaHa?: number;
  areaConsolidada?: string;
  municipio?: string;
  uf?: string;
  appInformadaCarHa?: number;
  rlInformadaCarHa?: number;
  porcentagemRlCar?: number;
  rlExigidaLeiHa?: number;
  areaTotalRlDeclaradaHa?: number;
  statusCAR?: string;
  condicaoCadastroCAR?: string;
  bioma?: string;
  microrregiao?: string;
  mesorregiao?: string;
  baciaHidrografica?: string;
  regiaoAmazonica?: boolean;
  latitude?: number;
  longitude?: number;
  distanciaMunicipioSedeKm?: number;
  cardoc?: string;
  modulosFiscais?: number;
  /** Método usado para localizar o imóvel (pacote automatizado). */
  metodoLocalizacao?: string;
  perimetroFonte?: string;
  confiancaLocalizacao?: string;
  carResolvidoAutomaticamente?: boolean;
  gpsAccuracyM?: number;
  codigoTerritorio?: string;
  tipoExploracao?: string;
};

/** Agente envolvido com o território (TOMADOR, etc.) */
export type AgenteTerritorio = {
  nome: string;
  documento: string; // CPF/CNPJ
  codigo?: string;
  tipoAgente?: string;
};

/** Resultado de um critério no extrato socioambiental (semáforo em 4 níveis). */
export type ResultadoCriterioStatus =
  | 'Apto'
  | 'Alerta'
  | 'Inapto'
  | 'Não Analisado';

export type ResultadoCriterio = {
  criterio: string;
  resultado: ResultadoCriterioStatus;
  detalhe?: string;
};

/** Modo de relatório gerado no hub Análise Socioambiental. */
export type ModoRelatorioSocioambiental =
  | 'extrato_socioambiental'
  | 'extrato_risco_socioambiental'
  | 'extrato_completo';

/** Veredito global (Extrato Risco / resumo do completo). */
export type VereditoSocioambientalGlobal =
  | 'em_conformidade'
  | 'em_conformidade_com_alertas'
  | 'com_restricoes'
  | 'analise_incompleta';

/** Tipo de perímetro — rural (CAR) ou operação genérica. */
export type TipoPerimetroSocioambiental = 'car_rural' | 'poligono_operacao';

/** Gleba ou área vinculada (CPR, contrato, talhão). */
export type GlebaSocioambiental = {
  id: string;
  rotulo: string;
  areaHa?: number;
  /** GeoJSON Feature ou Polygon serializado. */
  geojson: string;
};

/** Preset de atividade (critérios e rótulos sugeridos). */
export type PresetAtividadeSocioambiental =
  | 'mg_padrao'
  | 'credito_rural'
  | 'empreendimento_geral'
  | 'protocolo_personalizado';

/** Agregação PRODES no extrato. */
export type ProdesModoCriterio = 'por_ano' | 'agregado';

/** Linha da tabela de risco por geometria (estilo Sicredi). */
export type RiscoCamadaLinha = {
  tipoRisco: string;
  layerId: string;
  sobreposicaoHa: number;
  sobreposicaoPct: number;
  proximidadeM?: number;
  bufferHa?: number;
  resultado: ResultadoCriterioStatus;
};

/** Cruzamento de risco para imóvel ou gleba. */
export type RiscoPorGeometria = {
  id: string;
  rotulo: string;
  areaHa: number;
  linhas: RiscoCamadaLinha[];
};

/** Alerta unificado no extrato completo (chave: tipoRisco + codigoAlerta). */
export type AlertaExtratoUnificado = {
  tipoRisco: string;
  codigoAlerta: string;
  resultado: ResultadoCriterioStatus;
  detalhe: string;
  geometrias: string[];
  origem: "criterio" | "risco" | "car" | "lista";
};

/** Detalhe de análise de um critério (ex.: PRODES, UC buffer) */
export type DetalheAnalise = {
  criterio: string;
  ano?: number;
  numeroDeteccoes?: number;
  tamanhoDeteccoesHa?: number;
  dataDeteccao?: string;
  areaSobreposicaoHa?: number;
  nomeUnidadeConservacao?: string;
  categoria?: string;
  esfera?: string;
  tipo?: string;
  observacao?: string;
};

/** Documento principal: Extrato de Análise Socioambiental */
export type AnaliseSocioambiental = {
  id: string;
  /** Cliente/empreendimento ao qual a análise se refere (preenchimento automático do cadastro) */
  clientId?: string;
  /** Empreendimento/projeto vinculado, se houver */
  projectId?: string;
  /** Nome do relatório ou da propriedade (ex.: W EGIDO AGROPECUARIA LTDA) */
  titulo: string;
  /** Data de emissão do extrato */
  dataEmissao?: string;
  /** Serial/identificador do relatório na origem (ex.: Sicoob) */
  serial?: string;
  /** Informações da propriedade */
  informacoesPropriedade: InformacoesPropriedade;
  /** Agentes (TOMADOR, etc.) */
  agentes: AgenteTerritorio[];
  /** Critérios e resultados (Apto/Inapto) */
  criteriosResultados: ResultadoCriterio[];
  /** Detalhes por critério (PRODES, UC, Reserva Legal, etc.) */
  detalhesAnalise: DetalheAnalise[];
  /** URL do PDF anexo, se importado */
  pdfUrl?: string;
  /** Blocos do pacote automatizado (ids de report-blocks-catalog). */
  pacoteBlocos?: string[];
  /** Preset de bioma usado na execução automatizada. */
  biomaPreset?: string;
  modoRelatorio?: ModoRelatorioSocioambiental;
  vereditoGlobal?: VereditoSocioambientalGlobal;
  tipoPerimetro?: TipoPerimetroSocioambiental;
  presetAtividade?: PresetAtividadeSocioambiental;
  prodesModo?: ProdesModoCriterio;
  glebas?: GlebaSocioambiental[];
  /** Tabelas de risco por imóvel/gleba (Extrato Risco). */
  riscoPorGeometria?: RiscoPorGeometria[];
  /** Alertas deduplicados (Extrato completo). */
  alertasUnificados?: AlertaExtratoUnificado[];
  /** Resumo: aptos / alertas / inaptos / não analisados. */
  resumoCriterios?: {
    apto: number;
    alerta: number;
    inapto: number;
    naoAnalisado: number;
  };
  /** Resumo do parecer IA, se gerado. */
  parecerIaResumo?: string;
  parecerIaProvider?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
};
