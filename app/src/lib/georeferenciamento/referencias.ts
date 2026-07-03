/** Links e referências oficiais — georreferenciamento no Brasil. */

export type GeorefReferencia = {
  id: string;
  titulo: string;
  orgao: string;
  url: string;
  descricao: string;
  categoria: "fundiario" | "ambiental" | "cartorio" | "tecnico" | "mg";
};

export const GEOREF_REFERENCIAS: GeorefReferencia[] = [
  {
    id: "sigef",
    titulo: "SIGEF — Sistema de Gestão Fundiária",
    orgao: "INCRA",
    url: "https://sigef.incra.gov.br/",
    descricao:
      "Certificação eletrônica de imóveis rurais, planilha eletrônica, requerimentos e consulta de parcelas.",
    categoria: "fundiario",
  },
  {
    id: "sigef-manual",
    titulo: "Manual do SIGEF",
    orgao: "INCRA",
    url: "https://sigef.incra.gov.br/documentos/manual/",
    descricao:
      "Credenciamento, preenchimento da planilha (vértices, perímetro, confrontantes) e fluxo de certificação.",
    categoria: "fundiario",
  },
  {
    id: "mtgir",
    titulo: "MTGIR — Manual Técnico de Georreferenciamento (2ª ed.)",
    orgao: "INCRA",
    url: "https://www.gov.br/incra/pt-br/assuntos/governanca-fundiaria/certificacao-imoveis",
    descricao:
      "Normas técnicas aprovadas pela Portaria INCRA nº 2.502/2022 (SIRGAS2000, métodos GNSS, planta e memorial).",
    categoria: "tecnico",
  },
  {
    id: "servico-certificar",
    titulo: "Validar levantamento topográfico de imóvel rural",
    orgao: "gov.br",
    url: "https://www.gov.br/pt-br/servicos/validar-levantamento-topografico-de-imovel-rural",
    descricao: "Serviço público: envio ao SIGEF e geração de certificação/planta/memorial.",
    categoria: "fundiario",
  },
  {
    id: "car",
    titulo: "SICAR — Cadastro Ambiental Rural",
    orgao: "Serviço Florestal Brasileiro",
    url: "https://www.car.gov.br/",
    descricao:
      "Inscrição georreferenciada de imóveis rurais (perímetro, APP, RL, áreas de uso restrito).",
    categoria: "ambiental",
  },
  {
    id: "regularizacao-ambiental",
    titulo: "Regularização ambiental (CAR)",
    orgao: "MMA / gov.br",
    url: "https://www.gov.br/florestal/pt-br/assuntos/regularizacao-ambiental",
    descricao: "Fluxo de inscrição, análise estadual e termo de compromisso.",
    categoria: "ambiental",
  },
  {
    id: "in-mma-car",
    titulo: "IN MMA nº 2/2014 (procedimentos CAR)",
    orgao: "MMA",
    url: "https://www.legisweb.com.br/legislacao/?id=488674",
    descricao: "Instrução normativa sobre cadastro, retificação e validação georreferenciada.",
    categoria: "ambiental",
  },
  {
    id: "idesisema",
    titulo: "IDE-SisemaNet (MG)",
    orgao: "Sisema-MG",
    url: "https://visualizador.idesisema.meioambiente.mg.gov.br/",
    descricao: "Geovisualizador estadual para consulta de camadas e imóveis em Minas Gerais.",
    categoria: "mg",
  },
  {
    id: "ccir",
    titulo: "CCIR — Certificado de Cadastro de Imóvel Rural",
    orgao: "INCRA",
    url: "https://www.gov.br/incra/pt-br/assuntos/cadastro-credito-rural/ccir",
    descricao: "Documento frequentemente exigido junto ao georreferenciamento e registro.",
    categoria: "fundiario",
  },
];

export const GEOREF_PRAZOS_OBRIGATORIEDADE = [
  {
    titulo: "Transações e registro de imóvel rural",
    texto:
      "Georreferenciamento certificado no SIGEF é exigido para alterações de área ou titularidade em cartório (compra, venda, desmembramento, partilha, doação). A obrigatoriedade foi ampliada progressivamente (25 ha, depois todos os tamanhos conforme normas INCRA em vigor).",
    fonte: "INCRA / SIGEF",
  },
  {
    titulo: "CAR — inscrição georreferenciada",
    texto:
      "Todo imóvel rural deve estar inscrito no CAR com perímetro e informações ambientais georreferenciadas (Lei 12.651/2012). A validação é do órgão estadual de meio ambiente.",
    fonte: "SFB / MMA",
  },
  {
    titulo: "Lotes urbanos",
    texto:
      "Em áreas urbanas, a exigência depende do município e do cartório: desmembramento, loteamento, retificação de área ou registro com coordenadas (padrões técnicos frequentemente alinhados ao INCRA/SIRGAS2000).",
    fonte: "Cartórios / prefeituras",
  },
];
