/** Etapas e checklists por linha de processo (base: SIGEF, MTGIR, CAR, cartório). */

export type GeorefChecklistItem = {
  id: string;
  label: string;
  hint?: string;
  obrigatorio?: boolean;
};

export type GeorefProcessoDef = {
  id: string;
  titulo: string;
  descricao: string;
  etapas: { ordem: number; titulo: string; descricao: string }[];
  checklist: GeorefChecklistItem[];
};

export const PROCESSO_RURAL_SIGEF: GeorefProcessoDef = {
  id: "rural-sigef",
  titulo: "Imóvel rural — certificação SIGEF (INCRA)",
  descricao:
    "Fluxo oficial: profissional credenciado → planilha eletrônica → certificação automática (se sem sobreposição) → planta e memorial → registro no RI.",
  etapas: [
    {
      ordem: 1,
      titulo: "Contratação e credenciamento",
      descricao:
        "Contratar geomensor/engenheiro credenciado no SIGEF (ICP-Brasil). Registrar ART/RRT no CREA.",
    },
    {
      ordem: 2,
      titulo: "Levantamento de campo (GNSS)",
      descricao:
        "Coleta de vértices com GNSS (RTK, estático, PPP-RTK conforme MTGIR). Coordenadas em SIRGAS2000.",
    },
    {
      ordem: 3,
      titulo: "Planilha eletrônica SIGEF",
      descricao:
        "Preencher abas: identificação do serviço, detentor, área, perímetro, vértices, limites e confrontantes.",
    },
    {
      ordem: 4,
      titulo: "Certificação no SIGEF",
      descricao:
        "Envio e análise automática (sobreposição, consistência). Tipos: certificação, retificação, desmembramento, remembramento, cancelamento.",
    },
    {
      ordem: 5,
      titulo: "Documentos certificados",
      descricao: "Gerar planta e memorial descritivo assinados digitalmente no SIGEF.",
    },
    {
      ordem: 6,
      titulo: "Registro no cartório (RI)",
      descricao:
        "Apresentar certificação, planta, memorial, ART, anuências de confrontantes, CCIR, ITR e CAR quando exigidos.",
    },
  ],
  checklist: [
    { id: "rt-credenciado", label: "RT credenciado no SIGEF com certificado ICP-Brasil", obrigatorio: true },
    { id: "art-rrt", label: "ART/RRT registrada no CREA", obrigatorio: true },
    { id: "matricula-ccir", label: "Matrícula, CCIR e documentos do titular reunidos", obrigatorio: true },
    { id: "campo-gnss", label: "Levantamento de campo concluído (GNSS conforme MTGIR)", obrigatorio: true },
    { id: "planilha-sigef", label: "Planilha eletrônica SIGEF preenchida e validada", obrigatorio: true },
    { id: "certificacao-ok", label: "Certificação SIGEF emitida (sem pendência de sobreposição)", obrigatorio: true },
    { id: "planta-memorial", label: "Planta e memorial descritivo gerados", obrigatorio: true },
    { id: "anuencias", label: "Anuências de confrontantes (firma reconhecida quando exigido)", obrigatorio: true },
    { id: "car-atualizado", label: "CAR compatível com o perímetro certificado", obrigatorio: true },
    { id: "registro-ri", label: "Protocolo no Registro de Imóveis", obrigatorio: true },
  ],
};

export const PROCESSO_URBANO_CARTORIO: GeorefProcessoDef = {
  id: "urbano-cartorio",
  titulo: "Lote urbano — memorial e registro",
  descricao:
    "Levantamento com GNSS, planta e memorial em SIRGAS2000/UTM; aprovação municipal quando couber; averbação no RI.",
  etapas: [
    { ordem: 1, titulo: "Análise da matrícula e exigências do cartório", descricao: "Verificar se o município exige georreferenciamento para o ato (desmembramento, retificação, etc.)." },
    { ordem: 2, titulo: "Levantamento topográfico", descricao: "Medição de vértices e confrontações com equipamento GNSS." },
    { ordem: 3, titulo: "Elaboração técnica", descricao: "Planta georreferenciada e memorial descritivo; ART/RRT." },
    { ordem: 4, titulo: "Aprovação municipal", descricao: "Quando exigido: alinhamento com projeto aprovado ou código urbanístico." },
    { ordem: 5, titulo: "Registro / averbação", descricao: "Protocolo no cartório de registro de imóveis da comarca." },
  ],
  checklist: [
    { id: "exigencias-ri", label: "Exigências do cartório e prefeitura levantadas", obrigatorio: true },
    { id: "art-urbana", label: "ART/RRT do responsável técnico", obrigatorio: true },
    { id: "levantamento-urbano", label: "Levantamento de campo concluído", obrigatorio: true },
    { id: "sirgas-utm", label: "Coordenadas em SIRGAS2000 / UTM documentadas", obrigatorio: true },
    { id: "planta-memorial-urb", label: "Planta e memorial descritivo elaborados", obrigatorio: true },
    { id: "aprovacao-municipal", label: "Aprovação municipal (se aplicável)", obrigatorio: false },
    { id: "protocolo-ri", label: "Protocolo no registro de imóveis", obrigatorio: true },
  ],
};

export const PROCESSO_AMBIENTAL_CAR: GeorefProcessoDef = {
  id: "ambiental-car",
  titulo: "CAR — perímetro e camadas ambientais",
  descricao:
    "Autodeclaração georreferenciada no SICAR; análise e ateste pelo órgão estadual (em MG: Sisema). Compatibilizar com SIGEF quando houver certificação fundiária.",
  etapas: [
    { ordem: 1, titulo: "Inscrição / retificação no SICAR", descricao: "Perímetro do imóvel, APP, RL, áreas de uso restrito e demais camadas." },
    { ordem: 2, titulo: "Documentação complementar", descricao: "Propriedade, posse, reservas e declarações conforme IN MMA 2/2014." },
    { ordem: 3, titulo: "Análise estadual", descricao: "Acompanhamento de pendências e ateste de adequação ambiental." },
    { ordem: 4, titulo: "Compatibilização SIGEF", descricao: "Alinhar perímetro certificado no INCRA com o polígono do CAR." },
  ],
  checklist: [
    { id: "recibo-car", label: "Recibo de inscrição ou retificação no SICAR", obrigatorio: true },
    { id: "perimetro-car", label: "Perímetro georreferenciado desenhado/validado", obrigatorio: true },
    { id: "app-rl", label: "APP e Reserva Legal mapeadas", obrigatorio: true },
    { id: "documentos-posse", label: "Documentos de propriedade ou posse anexados", obrigatorio: true },
    { id: "pendencias-sema", label: "Pendências do órgão estadual sanadas", obrigatorio: true },
    { id: "compat-sigef", label: "Compatibilização com SIGEF (imóvel rural certificado)", obrigatorio: false },
  ],
};

export const PROCESSO_CAMPO: GeorefProcessoDef = {
  id: "campo-gnss",
  titulo: "Levantamento de campo (GNSS / topografia)",
  descricao: "Atividades de campo comuns a rural, urbano e ambiental.",
  etapas: [
    { ordem: 1, titulo: "Planejamento", descricao: "Reconhecimento, acesso, confrontantes e pontos de referência." },
    { ordem: 2, titulo: "Coleta", descricao: "Vértices, altimetria quando exigida, fotos e croquis." },
    { ordem: 3, titulo: "Processamento", descricao: "Ajuste, transformação de coordenadas, QA de precisão (sigmas)." },
  ],
  checklist: [
    { id: "equip-calibrado", label: "Equipamento GNSS calibrado e método conforme MTGIR", obrigatorio: true },
    { id: "vertices-coletados", label: "Todos os vértices do perímetro coletados", obrigatorio: true },
    { id: "fotos-campo", label: "Registro fotográfico e croqui de campo", obrigatorio: false },
    { id: "confrontantes-campo", label: "Identificação de confrontantes no terreno", obrigatorio: true },
    { id: "qa-precisao", label: "QA de precisão (sigmas / repetibilidade) documentado", obrigatorio: true },
  ],
};

export const PROCESSO_VALIDACOES: GeorefProcessoDef = {
  id: "validacoes-qa",
  titulo: "Validações técnicas e jurídicas",
  descricao: "Conferências antes de certificação e registro.",
  etapas: [
    { ordem: 1, titulo: "Sobreposição e vizinhança", descricao: "SIGEF/CAR/IDE: conflitos de polígonos." },
    { ordem: 2, titulo: "Área e matrícula", descricao: "Área calculada vs. matrícula e tolerâncias legais." },
    { ordem: 3, titulo: "Sistema de referência", descricao: "SIRGAS2000, zona UTM, meridiano central." },
  ],
  checklist: [
    { id: "sem-sobreposicao", label: "Sem sobreposição crítica em SIGEF/CAR", obrigatorio: true },
    { id: "area-consistente", label: "Área consistente com documentos e tolerância MTGIR", obrigatorio: true },
    { id: "crs-ok", label: "Sistema de coordenadas e metadados corretos", obrigatorio: true },
    { id: "fechamento-poligono", label: "Polígono fechado e vértices ordenados", obrigatorio: true },
  ],
};

export const PROCESSO_REGISTRO: GeorefProcessoDef = {
  id: "registro-cartorio",
  titulo: "Cartório — pacote para registro",
  descricao: "Checklist documental para protocolo no RI.",
  etapas: [
    { ordem: 1, titulo: "Montagem do pacote", descricao: "Reunir certificação, planta, memorial, ART, anuências." },
    { ordem: 2, titulo: "Protocolo e exigências", descricao: "Atender notas devolutivas do oficial registrador." },
  ],
  checklist: [
    { id: "cert-sigef-imp", label: "Certificação SIGEF / documentos assinados", obrigatorio: true },
    { id: "planta-memorial-imp", label: "Planta e memorial (vias exigidas)", obrigatorio: true },
    { id: "art-imp", label: "ART/RRT e identificação do RT", obrigatorio: true },
    { id: "anuencias-imp", label: "Anuências e declarações do proprietário", obrigatorio: true },
    { id: "ccir-itr", label: "CCIR e ITR quando exigidos", obrigatorio: false },
    { id: "car-imp", label: "Comprovante / recibo CAR", obrigatorio: false },
    { id: "taxas-ri", label: "Taxas e prenotação pagas", obrigatorio: true },
  ],
};

export const ALL_GEOREF_PROCESSOS: GeorefProcessoDef[] = [
  PROCESSO_RURAL_SIGEF,
  PROCESSO_URBANO_CARTORIO,
  PROCESSO_AMBIENTAL_CAR,
  PROCESSO_CAMPO,
  PROCESSO_VALIDACOES,
  PROCESSO_REGISTRO,
];

export function getProcessoById(id: string): GeorefProcessoDef | undefined {
  return ALL_GEOREF_PROCESSOS.find((p) => p.id === id);
}
