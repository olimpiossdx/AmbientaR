/** Tipos do módulo Programa de Educação Ambiental (PEA) — MG DN COPAM 214/238. */

export type PeaProgramStatus =
  | 'Rascunho'
  | 'Em elaboração'
  | 'Aprovado'
  | 'Em execução'
  | 'Arquivado';

export type PeaMonitoramentoTipo = 'formulario' | 'relatorio';

export type PeaMonitoramentoStatus = 'Rascunho' | 'Enviado';

export type PeaProjeto = {
  id: string;
  titulo: string;
  publicoAlvo: string;
  objetivosGerais?: string;
  objetivosEspecificos?: string;
  metodologia?: string;
  cronograma?: string;
  metas?: string;
  indicadores?: string;
  orcamentoResumo?: string;
};

export type PeaDspTecnica = {
  id: string;
  nome: string;
  data?: string;
  participantes?: string;
  resultados?: string;
};

export type PeaDsp = {
  mobilizacao?: string;
  tecnicas?: PeaDspTecnica[];
  devolutivas?: string;
  dispensadoPublicoInterno?: boolean;
  dispensadoPublicoFlutuante?: boolean;
  justificativaDispensaDsp?: string;
  notasParticipacao?: string;
};

/** Vínculo opcional com geo_analyses (Análise Geoespacial). */
export type PeaGeoVinculo = {
  /** Vazio quando só geometria (KML/CAR) foi aplicada, sem geo_analyses. */
  analysisId?: string;
  areaHa?: number;
  camadasOk?: string;
  importedAtUtc?: string;
  modoTexto?: 'substituir' | 'anexar';
  incluirSocioeconomico?: boolean;
  incluirTabelaCamadas?: boolean;
  incluirMeioFisico?: boolean;
  aplicarAutomatico?: boolean;
  /** Origem da última geometria aplicada (KML, CAR, georef, análise) */
  geometrySource?: 'geo_analysis' | 'georef' | 'car_shp' | 'kml_upload' | 'perimetro_referencia';
  geometryLabel?: string;
  vertexCount?: number;
};

/** Bloco livre para estrutura “maleável” além do TR fixo. */
export type PeaCampoExtra = {
  id: string;
  titulo: string;
  conteudo: string;
};

export type PeaMonitoramento = {
  id: string;
  tipo: PeaMonitoramentoTipo;
  ano: number;
  semestre: 1 | 2;
  introducao?: string;
  objetivos?: string;
  atividades?: string;
  metas?: string;
  indicadores?: string;
  avaliacao?: string;
  consideracoes?: string;
  anexosNotas?: string;
  status?: PeaMonitoramentoStatus;
  createdAt?: unknown;
};

export type PeaProgram = {
  id: string;
  status: PeaProgramStatus;
  empreendedorId: string;
  requerente: {
    clientId?: string;
    nome: string;
    cpfCnpj: string;
  };
  empreendimento: {
    projectId?: string;
    nome: string;
    denominacao?: string;
    car?: string;
    municipio?: string;
    uf?: string;
  };
  processoAdministrativo?: string;
  solicitacaoLicenciamento?: string;
  faseProcesso?: string;
  ampliacaoAlteracao?: 'sim' | 'nao';
  classeEmpreendimento?: string;
  porteEmpreendimento?: string;
  codigoTipologia?: string;
  tipologia?: string;
  orgaoLicenciador?: 'FEAM' | 'IEF' | 'SEMAD' | 'Outro';
  abeaDescricao?: string;
  abeaGeometriaNotas?: string;
  adaGeometriaNotas?: string;
  geoAnalysisId?: string;
  geoVinculo?: PeaGeoVinculo;
  /** Notas livres sobre TR / orientações do órgão */
  trOrientacoes?: string;
  /** Seções adicionais definidas pela consultoria */
  camposExtras?: PeaCampoExtra[];
  propostaEducacional?: string;
  articulacaoPoliticasPublicas?: string;
  peaConjuntoNotas?: string;
  cronogramaGeral?: string;
  dsp?: PeaDsp;
  projetos?: PeaProjeto[];
  monitoramentos?: PeaMonitoramento[];
  responsavelTecnico?: {
    id?: string;
    nome: string;
    documento?: string;
    formacao?: string;
    registroConselho?: string;
    art?: string;
    email?: string;
    telefone?: string;
  };
  createdAt: unknown;
  updatedAt?: unknown;
  createdBy: string;
};

export type DispensaPeaStatus = 'Rascunho' | 'Enviado' | 'Aprovado' | 'Indeferido';

/** Solicitação de dispensa do PEA (formulário FEAM / DN 238). */
export type DispensaPeaRecord = {
  id: string;
  status?: DispensaPeaStatus;
  empreendedorId: string;
  justificativa: string;
  createdAt: unknown;
  updatedAt?: unknown;
  createdBy: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  telefoneComercial?: string;
  telefoneCelular?: string;
  email?: string;
  coordenadas?: { latitude?: string; longitude?: string };
  processoAdministrativo?: string;
  solicitacaoLicenciamento?: string;
  faseProcesso?: string;
  ampliacaoAlteracao?: 'sim' | 'nao';
  classeEmpreendimento?: string;
  porteEmpreendimento?: string;
  codigoTipologia?: string;
  tipologia?: string;
  possuiLicenca?: 'sim' | 'nao';
  licencaAnterior?: {
    numeroProcesso?: string;
    tipoLicenca?: string;
    objeto?: string;
    dataConcessao?: string;
    validade?: string;
  };
  possuiPea?: 'sim' | 'nao';
  peaConformeDN?: 'sim' | 'nao';
  solicitacaoParcial?: boolean;
  dispensaParcialCampos?: string[];
  dispensaParcialOutro?: string;
  caracterizacaoSocioeconomica?: string;
  responsavel?: {
    id?: string;
    nome?: string;
    documento?: string;
    formacao?: string;
    cargo?: string;
    localData?: string;
    assinaturaUrl?: string;
  };
  /** URLs no Storage (KML, PDF diagnóstico, etc.) */
  anexos?: { nome: string; url: string; tipo?: string }[];
  geoAnalysisId?: string;
  geoVinculo?: PeaGeoVinculo;
};
