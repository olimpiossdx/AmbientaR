import type {
  FinancialAllocation,
  FinancialCenter,
  FinancialAssetSale,
  CenterTotals,
} from '@/lib/types';

export function datePart(dateStr: string | undefined): string {
  if (dateStr == null || dateStr === '') return '';
  const s = String(dateStr).slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(value) ? value : 0,
  );
}

const CENTER_TYPE_LABELS: Record<FinancialCenter['type'], string> = {
  project: 'Empreendimento',
  contract: 'Contrato cliente',
  supplier_contract: 'Contratação fornecedor',
  asset_sale: 'Venda de ativo',
};

export function getFinancialCenterTypeLabel(type: FinancialCenter['type']): string {
  return CENTER_TYPE_LABELS[type] ?? type;
}

export function computeAssetSaleReceived(sale: FinancialAssetSale): number {
  return sale.installments
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
}

export function computeAssetSaleOutstanding(sale: FinancialAssetSale): number {
  const total = Number(sale.totalValue) || 0;
  return Math.max(0, total - computeAssetSaleReceived(sale));
}

export function deriveAssetSaleStatus(sale: FinancialAssetSale): FinancialAssetSale['status'] {
  const total = Number(sale.totalValue) || 0;
  const received = computeAssetSaleReceived(sale);
  if (total <= 0) return sale.status;
  if (received >= total - 0.005) return 'settled';
  if (received > 0) return 'partial';
  return 'open';
}

function revenueBlockedByInvoice(
  allocation: FinancialAllocation,
  allocations: FinancialAllocation[],
): boolean {
  if (!allocation.invoiceId) return false;
  return allocations.some(
    (a) =>
      a.id !== allocation.id &&
      a.sourceType === 'invoice' &&
      a.sourceId === allocation.invoiceId,
  );
}

export function computeCenterTotals(
  center: FinancialCenter,
  allocations: FinancialAllocation[],
): CenterTotals {
  const forCenter = allocations.filter((a) => a.centerId === center.id);

  let cashCredits = 0;
  let cashDebits = 0;
  let barterCredits = 0;
  let contractCredits = Number(center.budgetRevenue) || 0;
  let contractDebits = Number(center.budgetCost) || 0;

  for (const a of forCenter) {
    const amount = Number(a.amount) || 0;
    if (a.direction === 'debit') {
      cashDebits += amount;
      contractDebits += amount;
      continue;
    }
    if (a.sourceType === 'barter_credit') {
      barterCredits += amount;
      contractCredits += amount;
      continue;
    }
    if (a.sourceType === 'revenue' && revenueBlockedByInvoice(a, forCenter)) {
      continue;
    }
    if (a.sourceType === 'invoice') {
      contractCredits += amount;
      cashCredits += amount;
      continue;
    }
    cashCredits += amount;
  }

  if (center.type === 'asset_sale') {
    const inv = Number(center.acquisitionCost) || 0;
    if (inv > 0) contractDebits = inv;
    contractCredits = Number(center.budgetRevenue) || cashCredits + barterCredits;
  }

  const cashBalance = cashCredits - cashDebits;
  const contractBalance = contractCredits - contractDebits;

  const investment =
    center.type === 'asset_sale'
      ? Number(center.acquisitionCost) || cashDebits
      : Number(center.budgetCost) || cashDebits;

  const returnAmount = cashCredits + barterCredits;

  const netResult =
    center.type === 'supplier_contract'
      ? contractDebits - cashDebits
      : returnAmount - investment;

  const roiPercent = investment > 0 ? (netResult / investment) * 100 : null;
  const marginPercent = returnAmount > 0 ? (netResult / returnAmount) * 100 : null;

  return {
    cashCredits,
    cashDebits,
    cashBalance,
    contractCredits,
    contractDebits,
    contractBalance,
    barterCredits,
    investment,
    returnAmount,
    netResult,
    roiPercent,
    marginPercent,
  };
}

export function formatRoi(roi: number | null): string {
  if (roi == null || !Number.isFinite(roi)) return '—';
  return `${roi.toFixed(1)}%`;
}
