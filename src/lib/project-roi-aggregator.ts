/**
 * Agregação gerencial por caso (Projetos & ROI) — não altera DRE global.
 */

import { datePart } from '@/lib/financial-core';
import { isTransactionNeutralizedByEstorno } from '@/lib/financial-transaction-scope';
import {
  DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS,
  resolveProjectRoiThresholds,
  type ProjectRoiSemaforoThresholds,
} from '@/lib/project-roi-thresholds';
import type {
  Contract,
  Expense,
  ExpenseCategory,
  Invoice,
  ProjectRoiCase,
  ProjectRoiSemaforo,
  Revenue,
} from '@/lib/types';

export type ProjectRoiExtratoLineKind =
  | 'revenue'
  | 'expense'
  | 'invoice_paid'
  | 'orcamento_credito';

export type ProjectRoiExtratoLine = {
  id: string;
  kind: ProjectRoiExtratoLineKind;
  date: string;
  description: string;
  amount: number;
  counterparty?: string;
  sourceCollection: string;
  /** Receita registrada como abatimento de crédito (compensação em serviços). */
  isAbatimento?: boolean;
  category?: ExpenseCategory;
  impostoValor?: number;
  centroCusto?: string;
  contractId?: string;
  invoiceId?: string;
  supplierId?: string;
  clientId?: string;
  isEstorno?: boolean;
  estornoDeId?: string;
  hasComprovante?: boolean;
  fileUrl?: string;
  /** Saldo de caixa acumulado após a linha (linhas informativas de orçamento não alteram). */
  saldoAcumulado?: number | null;
};

export type ProjectRoiSnapshot = {
  orcamento: number;
  recebido: number;
  pago: number;
  saldoCaixa: number;
  saldoOrcamento: number | null;
  aReceber: number | null;
  pctOrcamentoConsumido: number | null;
  pctRecebido: number | null;
  impostosDespesas: number;
  impostosProvisao: number;
  resultado: number;
  margemPct: number | null;
  semaforo: ProjectRoiSemaforo;
  extrato: ProjectRoiExtratoLine[];
  horasRegistradas: number;
  custoHoraImplicito: number | null;
  margemPorHora: number | null;
};

export { DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS };
export type { ProjectRoiSemaforoThresholds };

const EMPATE_TOLERANCE_REAIS = DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS.empateToleranceReais;
const EMPATE_TOLERANCE_PCT = DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS.empateTolerancePct;

function isAbatimentoDescription(description: string): boolean {
  return /abatimento/i.test(description);
}

export function isAbatimentoExtratoLine(line: ProjectRoiExtratoLine): boolean {
  return (
    line.isAbatimento === true ||
    (line.kind === 'revenue' && isAbatimentoDescription(line.description))
  );
}

export function extratoLineTipoLabel(line: ProjectRoiExtratoLine): string {
  if (line.kind === 'orcamento_credito') return 'Crédito inicial';
  if (line.kind === 'expense') return 'Saída';
  if (line.kind === 'invoice_paid') return 'Recebimento';
  if (line.kind === 'revenue') {
    return isAbatimentoExtratoLine(line) ? 'Abatimento' : 'Recebimento';
  }
  return '—';
}

export type ExtratoValorVariant = 'credito' | 'debito';

/** Azul: crédito inicial (informativo) e recebimentos. Vermelho: abatimentos e saídas. */
export function extratoValorVariant(line: ProjectRoiExtratoLine): ExtratoValorVariant {
  if (line.kind === 'orcamento_credito') return 'credito';
  if (line.kind === 'expense') return 'debito';
  if (line.kind === 'invoice_paid') return 'credito';
  if (line.kind === 'revenue') {
    return isAbatimentoExtratoLine(line) ? 'debito' : 'credito';
  }
  return 'debito';
}

/** Saldo de caixa acumulado linha a linha (orçamento inicial é informativo). */
export function computeExtratoSaldoAcumulado(
  lines: ProjectRoiExtratoLine[],
): ProjectRoiExtratoLine[] {
  let saldo = 0;
  return lines.map((line) => {
    if (line.kind === 'orcamento_credito') {
      return { ...line, saldoAcumulado: null };
    }
    const variant = extratoValorVariant(line);
    saldo += variant === 'credito' ? line.amount : -line.amount;
    return { ...line, saldoAcumulado: saldo };
  });
}

function amountOf(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isNeutralizedByEstorno(
  docId: string,
  revenues: Revenue[],
  expenses: Expense[],
): boolean {
  return isTransactionNeutralizedByEstorno(docId, revenues, expenses);
}

function shouldSkipAsEstorno(item: Revenue | Expense): boolean {
  return Boolean(item.isEstorno);
}

function shouldSkipDeleted(item: Revenue | Expense): boolean {
  return Boolean(item.deletedAt?.trim());
}

/** Vínculo explícito ao caso (lançamento gerencial Projetos & ROI). */
export function transactionLinksToCase(
  item: {
    projectRoiCaseId?: string;
    contractId?: string;
    projectId?: string;
    centroCusto?: string;
  },
  roiCase: ProjectRoiCase,
): boolean {
  return Boolean(roiCase.id && item.projectRoiCaseId === roiCase.id);
}

/** Fallback legado — só para futura UI de classificação manual (Fase 2). */
export function transactionLegacyLinksToCase(
  item: {
    projectRoiCaseId?: string;
    contractId?: string;
    projectId?: string;
    centroCusto?: string;
  },
  roiCase: ProjectRoiCase,
): boolean {
  if (transactionLinksToCase(item, roiCase)) return true;
  if (roiCase.contractId && item.contractId === roiCase.contractId) return true;
  if (roiCase.projectId && item.projectId === roiCase.projectId) return true;
  const ref = roiCase.sourceProposalNumber?.trim();
  if (ref && item.centroCusto?.includes(ref)) return true;
  return false;
}

function invoiceLinksToCase(invoice: Invoice, roiCase: ProjectRoiCase): boolean {
  return invoice.projectRoiCaseId === roiCase.id;
}

function calcImpostosProvisao(
  roiCase: ProjectRoiCase,
  recebidoNoPeriodo: number,
): number {
  let total = 0;
  const pct = amountOf(roiCase.aliquotaImpostoPct);
  if (pct > 0) total += recebidoNoPeriodo * (pct / 100);
  total += amountOf(roiCase.impostoEstimadoValor);
  return total;
}

function calcSemaforo(
  resultado: number,
  recebido: number,
  margemPct: number | null,
  orcamento: number,
  pago: number,
  thresholds: ProjectRoiSemaforoThresholds = DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS,
): ProjectRoiSemaforo {
  if (recebido <= 0 && pago <= 0) return 'sem_movimento';
  const empate =
    Math.abs(resultado) <= thresholds.empateToleranceReais ||
    (recebido > 0 &&
      Math.abs(resultado) / recebido <= thresholds.empateTolerancePct);
  if (empate) return 'empatando';
  if (resultado < 0 || (orcamento > 0 && pago > orcamento)) return 'perdendo';
  if (
    margemPct != null &&
    margemPct >= thresholds.margemVerdeMinPct
  ) {
    return 'ganhando';
  }
  if (resultado > 0) return 'ganhando';
  return 'perdendo';
}

export function buildProjectRoiSnapshot(
  roiCase: ProjectRoiCase,
  revenues: Revenue[],
  expenses: Expense[],
  invoices: Invoice[],
  options?: {
    clientNameById?: Map<string, string>;
    supplierNameById?: Map<string, string>;
    semaforoThresholds?: Partial<ProjectRoiSemaforoThresholds> | null;
  },
): ProjectRoiSnapshot {
  const linkedRevenues = revenues.filter(
    (r) =>
      transactionLinksToCase(r, roiCase) &&
      !shouldSkipDeleted(r) &&
      !shouldSkipAsEstorno(r) &&
      !isNeutralizedByEstorno(r.id, revenues, expenses),
  );
  const linkedExpenses = expenses.filter(
    (e) =>
      transactionLinksToCase(e, roiCase) &&
      !shouldSkipDeleted(e) &&
      !shouldSkipAsEstorno(e) &&
      !isNeutralizedByEstorno(e.id, revenues, expenses),
  );
  const linkedInvoicesPaid = invoices.filter(
    (i) => i.status === 'Paid' && invoiceLinksToCase(i, roiCase),
  );

  const revenueIdsFromInvoices = new Set(
    linkedRevenues.filter((r) => r.invoiceId).map((r) => r.invoiceId),
  );

  let recebidoFaturas = 0;
  for (const inv of linkedInvoicesPaid) {
    const dup = linkedRevenues.some((r) => r.invoiceId === inv.id);
    if (!dup) recebidoFaturas += amountOf(inv.amount);
  }

  const recebidoCaixaAvulso = linkedRevenues
    .filter((r) => !r.invoiceId)
    .reduce((a, r) => a + amountOf(r.amount), 0);

  const recebido = recebidoFaturas + recebidoCaixaAvulso;

  let impostosDespesas = 0;
  let pago = 0;
  for (const e of linkedExpenses) {
    const amt = amountOf(e.amount);
    pago += amt;
    impostosDespesas += amountOf(e.impostoValor);
    if (!e.impostoValor && e.category === 'impostos') {
      impostosDespesas += amt;
    }
  }

  const impostosProvisao = calcImpostosProvisao(roiCase, recebido);
  const resultado = recebido - pago - impostosDespesas - impostosProvisao;
  const orcamento = amountOf(roiCase.orcamentoValor);
  const saldoCaixa = recebido - pago;
  const saldoOrcamento = orcamento > 0 ? orcamento - pago : null;
  const aReceber = orcamento > 0 ? Math.max(0, orcamento - recebido) : null;
  const margemPct = recebido > 0 ? (resultado / recebido) * 100 : null;
  const thresholds = resolveProjectRoiThresholds(options?.semaforoThresholds);
  const semaforo = calcSemaforo(
    resultado,
    recebido,
    margemPct,
    orcamento,
    pago,
    thresholds,
  );

  const horasRegistradas = amountOf(roiCase.horasRegistradas);
  const despesasDiretas = pago + impostosDespesas + impostosProvisao;
  const custoHoraImplicito =
    horasRegistradas > 0 ? despesasDiretas / horasRegistradas : null;
  const margemPorHora =
    horasRegistradas > 0 ? resultado / horasRegistradas : null;

  const extrato: ProjectRoiExtratoLine[] = [];

  if (orcamento > 0) {
    extrato.push({
      id: `orcamento-${roiCase.id}`,
      kind: 'orcamento_credito',
      date:
        datePart(roiCase.contractSignedAt || roiCase.createdAt) ||
        roiCase.createdAt.slice(0, 10),
      description: 'Crédito inicial (orçamento)',
      amount: orcamento,
      sourceCollection: 'project_roi_cases',
    });
  }

  for (const inv of linkedInvoicesPaid) {
    if (linkedRevenues.some((r) => r.invoiceId === inv.id)) continue;
    extrato.push({
      id: inv.id,
      kind: 'invoice_paid',
      date: datePart(inv.invoiceDate) || inv.invoiceDate,
      description: `Fatura ${inv.invoiceNumber} (paga)`,
      amount: amountOf(inv.amount),
      counterparty: options?.clientNameById?.get(inv.clientId),
      clientId: inv.clientId,
      contractId: inv.contractId,
      centroCusto: inv.centroCusto,
      sourceCollection: 'invoices',
    });
  }

  for (const r of linkedRevenues) {
    extrato.push({
      id: r.id,
      kind: 'revenue',
      date: datePart(r.date) || r.date,
      description: r.description,
      amount: amountOf(r.amount),
      counterparty: r.clientId
        ? options?.clientNameById?.get(r.clientId)
        : undefined,
      clientId: r.clientId,
      contractId: r.contractId,
      invoiceId: r.invoiceId,
      centroCusto: r.centroCusto,
      isEstorno: r.isEstorno,
      estornoDeId: r.estornoDeId,
      hasComprovante: Boolean(r.fileUrl?.trim()),
      fileUrl: r.fileUrl,
      sourceCollection: 'revenues',
      isAbatimento: isAbatimentoDescription(r.description),
    });
  }

  for (const e of linkedExpenses) {
    extrato.push({
      id: e.id,
      kind: 'expense',
      date: datePart(e.date) || e.date,
      description: e.description,
      amount: amountOf(e.amount),
      counterparty: e.supplierId
        ? options?.supplierNameById?.get(e.supplierId)
        : undefined,
      supplierId: e.supplierId,
      category: e.category,
      impostoValor: e.impostoValor,
      contractId: e.contractId,
      centroCusto: e.centroCusto,
      isEstorno: e.isEstorno,
      estornoDeId: e.estornoDeId,
      hasComprovante: Boolean(e.fileUrl?.trim()),
      fileUrl: e.fileUrl,
      sourceCollection: 'expenses',
    });
  }

  extrato.sort((a, b) => {
    if (a.kind === 'orcamento_credito' && b.kind !== 'orcamento_credito') return -1;
    if (b.kind === 'orcamento_credito' && a.kind !== 'orcamento_credito') return 1;
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });

  const extratoComSaldo = computeExtratoSaldoAcumulado(extrato);

  return {
    orcamento,
    recebido,
    pago,
    saldoCaixa,
    saldoOrcamento,
    aReceber,
    pctOrcamentoConsumido: orcamento > 0 ? (pago / orcamento) * 100 : null,
    pctRecebido: orcamento > 0 ? (recebido / orcamento) * 100 : null,
    impostosDespesas,
    impostosProvisao,
    resultado,
    margemPct,
    semaforo,
    extrato: extratoComSaldo,
    horasRegistradas,
    custoHoraImplicito,
    margemPorHora,
  };
}

export function contractQualifiesForFormalCase(contract: Contract): boolean {
  return contract.status === 'Aprovado' && Boolean(contract.fileUrl?.trim());
}

export function contractPendingSignature(contract: Contract): boolean {
  return contract.status === 'Aprovado' && !contract.fileUrl?.trim();
}

export function caseFromContract(contract: Contract, nowIso: string): Omit<ProjectRoiCase, 'id'> {
  const clientId =
    contract.contratante?.clientId || contract.clientId || undefined;
  return {
    origin: 'formal',
    statusGovernanca: 'ativo',
    projectId: undefined,
    empreendimentoTexto: contract.objeto?.empreendimento,
    empreendedorId: undefined,
    clientId,
    contractId: contract.id,
    sourceProposalId: contract.sourceProposalId,
    sourceProposalNumber: contract.sourceProposalNumber,
    apelido: contract.objeto?.empreendimento || contract.sourceProposalNumber,
    orcamentoValor: amountOf(contract.pagamento?.valorTotal),
    orcamentoItens: contract.objeto?.itens,
    contractSignedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
