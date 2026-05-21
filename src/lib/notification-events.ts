/** Tipos de origem para deduplicação e roteamento no sino / push. */
export const NOTIFICATION_SOURCE = {
  multa_defesa: "multa_defesa",
  prazo_multa_defesa: "prazo_multa_defesa",
  prazo_condicionante: "prazo_condicionante",
  prazo_licenca: "prazo_licenca",
  prazo_outorga: "prazo_outorga",
  prazo_intervencao: "prazo_intervencao",
  licenca: "licenca",
  outorga: "outorga",
  intervencao: "intervencao",
  car: "car",
  fauna: "fauna",
  uso_insignificante: "uso_insignificante",
  condicionante: "condicionante",
  vistoria: "inspection_report",
  oficio: "oficio",
  fatura: "fatura",
  proposta_comercial: "proposta_comercial",
  contrato: "contrato",
} as const;

export type NotificationSourceType =
  (typeof NOTIFICATION_SOURCE)[keyof typeof NOTIFICATION_SOURCE];

export const NOTIFICATION_LINKS = {
  multasDefesas: "/multas-defesas",
  compliance: "/compliance",
  licenses: "/licenses",
  outorgas: "/outorgas",
  intervencoes: "/intervencoes",
  car: "/car",
  fauna: "/fauna",
  usosInsignificantes: "/usos-insignificantes",
  oficios: "/oficios",
  invoices: "/invoices",
  commercialProposals: "/commercial-proposals",
  contracts: "/contracts",
  inspectionsReports: "/inspections/reports",
} as const;
