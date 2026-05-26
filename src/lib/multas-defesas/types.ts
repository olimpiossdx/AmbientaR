import type {
  DecisaoEncerramento,
  MultaDefesaFluxo,
  MultaDefesaStatus,
  SolicitacaoDefesaCliente,
} from "@/lib/multas-defesas";

export type TipoDefesa =
  | "Defesa em 1º Instância / Administrativa"
  | "Defesa em 2º Instância / Administrativa";

export type OrgaoAmbientalMg = "SEMAD" | "FEAM" | "IGAM" | "IEF";

export type MultaDefesaFase =
  | "abertura"
  | "instrucao"
  | "elaboracao"
  | "protocolo"
  | "decisao"
  | "encerrado"
  | "cnr";

export type MultaDefesaDocKind = "anexar" | "elaborar";

export type MultaDefesaDocRequirement =
  | "sempre"
  | "pj"
  | "procurador"
  | "taxa_expediente"
  | "opcional";

export type MultaDefesaDocTemplate = {
  id: string;
  label: string;
  kind: MultaDefesaDocKind;
  phase: "instrucao" | "elaboracao" | "protocolo";
  requirement: MultaDefesaDocRequirement;
  helpUrl?: string;
};

export type MultaDefesaDocumentState = MultaDefesaDocTemplate & {
  checked: boolean;
  fileName?: string;
  fileUrl?: string;
  contentType?: string;
  notes?: string;
};

export type DefesaAnexo = {
  name: string;
  url: string;
  contentType: string;
  checklistItemId?: string;
  documentId?: string;
};

export type DefesaConteudo = {
  autoNumero?: string;
  autoCodigo?: string;
  autoArtigoBase?: string;
  autoRelatoFiscal?: string;
  autoValorMulta?: string;
  autoMedidaCautelar?: string;
  autoDataFato?: string;
  empreendimentoCoordenadas?: string;
  empreendimentoCidade?: string;
  empreendimentoAtividadePrincipal?: string;
  empreendimentoNumeroLicenca?: string;
  laudoNumero?: string;
  laudoTrechoTecnico?: string;
  enderecamentoQualificacao?: string;
  referenciaAutoProcesso?: string;
  sinteseAuto?: string;
  preliminaresNulidades?: string;
  decadenciaPrescricao?: string;
  meritoInexistenciaFato?: string;
  meritoAtipicidade?: string;
  meritoAusenciaAutoria?: string;
  meritoRegularidadeAtividade?: string;
  atenuantes?: string;
  conversaoMulta?: string;
  pedidos?: string;
};

export type ProtocoloMeio = "presencial" | "correios_ar" | "sei";

export type MultaDefesaProtocolo = {
  orgao?: OrgaoAmbientalMg;
  unidadeIndicadaNoAuto?: string;
  meio?: ProtocoloMeio;
  dataProtocolo?: string;
  seiNumeroProcesso?: string;
  correiosAr?: string;
  comprovante?: DefesaAnexo;
  observacoes?: string;
};

export type MultaDefesaDecisao = {
  resultado?: "procedente" | "improcedente" | "parcial" | "nao_conhecida";
  dataCiencia?: string;
  resumo?: string;
  anexo?: DefesaAnexo;
};

export type MultaDefesaCnr = {
  paCap?: string;
  numeroAi?: string;
  linkPautaRo?: string;
  dataReuniao?: string;
  resultado?: string;
  observacoes?: string;
};

export type VistaProcesso = {
  solicitadaEm?: string;
  confirmadaEm?: string;
  observacoes?: string;
};

export type AutoInfracaoDefesaRecord = MultaDefesaFluxo & {
  id: string;
  empreendedorId: string;
  projectId: string;
  processNumber: string;
  processYear: number;
  processSequence: number;
  faseAtual?: MultaDefesaFase;
  orgaoAmbiental?: OrgaoAmbientalMg;
  tipoDefesa?: TipoDefesa;
  observacoes?: string;
  informacoesInternas?: string;
  defesaConteudo?: DefesaConteudo;
  documentos?: MultaDefesaDocumentState[];
  vistaProcesso?: VistaProcesso;
  protocolo?: MultaDefesaProtocolo;
  decisao1Instancia?: MultaDefesaDecisao;
  cnr?: MultaDefesaCnr;
  modeloPeticaoId?: string;
  checklist?: Array<{ itemId: string; checked: boolean }>;
  anexos?: DefesaAnexo[];
  solicitacaoDefesaCliente?: SolicitacaoDefesaCliente;
  decisaoEncerramento?: DecisaoEncerramento;
  status?: MultaDefesaStatus;
  createdAt?: unknown;
  createdBy?: string;
};

export type PetitionSectionId = keyof Pick<
  DefesaConteudo,
  | "enderecamentoQualificacao"
  | "referenciaAutoProcesso"
  | "sinteseAuto"
  | "preliminaresNulidades"
  | "decadenciaPrescricao"
  | "meritoInexistenciaFato"
  | "meritoAtipicidade"
  | "meritoAusenciaAutoria"
  | "meritoRegularidadeAtividade"
  | "atenuantes"
  | "conversaoMulta"
  | "pedidos"
>;
