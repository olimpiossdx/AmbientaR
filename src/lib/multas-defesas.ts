/**
 * Multas e defesas (autos de infração) — status, prazos e rótulos de menu.
 */

export const MULTAS_E_DEFESAS_MENU_LABEL = "Multas e Defesas";

/** Rota canónica do módulo (legado: /autos-infracao-defesa redireciona). */
export const MULTAS_DEFESAS_PATH = "/multas-defesas";

export const PRAZO_DEFESA_1_INSTANCIA_DIAS = 20;

export type MultaDefesaStatus =
  | "aguardando_opcao"
  | "demanda_defesa_pendente"
  | "defesa_em_elaboracao"
  | "defesa_concluida"
  | "encerrada_pagamento"
  | "encerrada_parcelamento"
  | "encerrada_pecma";

export type DecisaoEncerramentoTipo = "pagamento" | "parcelamento" | "pecma";

export type DecisaoEncerramento = {
  tipo: DecisaoEncerramentoTipo;
  descricao: string;
  dataDecisao: string;
  anexo?: {
    name: string;
    url: string;
    contentType?: string;
  };
  registradoEm?: string;
  registradoPor?: string;
};

export type SolicitacaoDefesaCliente = {
  solicitadoEm: string;
  texto?: string;
  status: "pendente" | "em_atendimento" | "atendida";
};

/** Campos de fluxo multa/defesa (coleção Firestore `autoInfracaoDefesas`). */
export type MultaDefesaFluxo = {
  status?: MultaDefesaStatus;
  dataCientificacao?: string;
  prazoDefesaDias?: number;
  decisaoEncerramento?: DecisaoEncerramento;
  solicitacaoDefesaCliente?: SolicitacaoDefesaCliente;
};

export const MULTA_STATUS_LABELS: Record<MultaDefesaStatus, string> = {
  aguardando_opcao: "Aguardando opção do cliente",
  demanda_defesa_pendente: "Demanda de defesa (cliente)",
  defesa_em_elaboracao: "Defesa em elaboração",
  defesa_concluida: "Defesa concluída",
  encerrada_pagamento: "Encerrada — pagamento",
  encerrada_parcelamento: "Encerrada — parcelamento",
  encerrada_pecma: "Encerrada — PECMA",
};

export const DECISAO_ENCERRAMENTO_LABELS: Record<DecisaoEncerramentoTipo, string> = {
  pagamento: "Pagamento da multa",
  parcelamento: "Pedido de parcelamento",
  pecma: "Adesão ao PECMA",
};

export function parseDateOnly(iso?: string): Date | null {
  if (!iso?.trim()) return null;
  const part = iso.trim().slice(0, 10);
  const [y, m, d] = part.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Dias corridos restantes até o fim do prazo (0 = último dia; negativo = vencido). */
export function diasCorridosRestantesDefesa(
  dataCientificacao: string | undefined,
  prazoDias = PRAZO_DEFESA_1_INSTANCIA_DIAS,
): number | null {
  const start = parseDateOnly(dataCientificacao);
  if (!start) return null;
  const limite = new Date(start);
  limite.setDate(limite.getDate() + prazoDias);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  limite.setHours(0, 0, 0, 0);
  const diffMs = limite.getTime() - hoje.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

export function inferMultaStatus(record: MultaDefesaFluxo & {
  tipoDefesa?: string;
  checklist?: { checked: boolean }[];
}): MultaDefesaStatus {
  if (record.status) return record.status;
  if (record.decisaoEncerramento?.tipo === "pagamento") return "encerrada_pagamento";
  if (record.decisaoEncerramento?.tipo === "parcelamento") return "encerrada_parcelamento";
  if (record.decisaoEncerramento?.tipo === "pecma") return "encerrada_pecma";
  if (record.solicitacaoDefesaCliente?.status === "pendente") {
    return "demanda_defesa_pendente";
  }
  if (record.dataCientificacao && !record.tipoDefesa) return "aguardando_opcao";
  if (record.tipoDefesa) return "defesa_em_elaboracao";
  return "defesa_em_elaboracao";
}

export function isMultaComPrazoEmAberto(
  record: MultaDefesaFluxo,
  prazoDias = PRAZO_DEFESA_1_INSTANCIA_DIAS,
): boolean {
  const status = inferMultaStatus(record);
  if (status !== "aguardando_opcao" && status !== "demanda_defesa_pendente") {
    return false;
  }
  const restantes = diasCorridosRestantesDefesa(record.dataCientificacao, prazoDias);
  return restantes !== null && restantes >= 0;
}

export function formatPrazoDefesaLabel(
  dataCientificacao: string | undefined,
  prazoDias = PRAZO_DEFESA_1_INSTANCIA_DIAS,
): string {
  const restantes = diasCorridosRestantesDefesa(dataCientificacao, prazoDias);
  if (restantes === null) return "Prazo não informado";
  if (restantes < 0) return `Prazo vencido há ${Math.abs(restantes)} dia(s)`;
  if (restantes === 0) return "Último dia do prazo (20 dias corridos)";
  return `${restantes} dia(s) corridos restantes`;
}
