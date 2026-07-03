/**
 * Diagnóstico: receita do caixa operacional vs faturas vs ROI.
 * Uso: npx tsx scripts/audit-company-caixa-revenue.ts [ano]
 */
import { calculateDre } from '../src/lib/financial-core';
import {
  filterCompanyCaixaRevenues,
  isExcludedFromCompanyCaixa,
  isProjectRoiOnlyTransaction,
  isSoftDeleted,
  revenueAmountForCompanyCaixa,
} from '../src/lib/financial-transaction-scope';
import type { Expense, Invoice, Revenue } from '../src/lib/types';
import { adminDb } from '../src/lib/firebase-admin';

const year = Number(process.argv[2]) || new Date().getFullYear();

function asRevenue(id: string, data: Record<string, unknown>): Revenue {
  return { id, ...(data as Omit<Revenue, 'id'>) };
}

function asExpense(id: string, data: Record<string, unknown>): Expense {
  return { id, ...(data as Omit<Expense, 'id'>) };
}

function asInvoice(id: string, data: Record<string, unknown>): Invoice {
  return { id, ...(data as Omit<Invoice, 'id'>) };
}

function inYear(dateStr: string | undefined): boolean {
  const p = String(dateStr || '').slice(0, 10);
  return p >= `${year}-01-01` && p <= `${year}-12-31`;
}

async function main() {
  console.log(`=== audit company caixa revenue (${year}) ===\n`);

  const caseSnap = await adminDb().collection('project_roi_cases').get();
  const caseIds = new Set(caseSnap.docs.map((d) => d.id));

  const [revSnap, expSnap, invSnap] = await Promise.all([
    adminDb().collection('revenues').get(),
    adminDb().collection('expenses').get(),
    adminDb().collection('invoices').get(),
  ]);

  const revenues = revSnap.docs.map((d) => asRevenue(d.id, d.data()));
  const expenses = expSnap.docs.map((d) => asExpense(d.id, d.data()));
  const invoices = invSnap.docs.map((d) => asInvoice(d.id, d.data()));

  const revYear = revenues.filter((r) => inYear(r.date));
  const caixaRev = filterCompanyCaixaRevenues(revenues, expenses, caseIds);
  const caixaRevYear = caixaRev.filter((r) => inYear(r.date));

  const sumRaw = revYear.reduce((a, r) => a + (Number(r.amount) || 0), 0);
  const sumCaixaNet = caixaRevYear.reduce(
    (a, r) => a + revenueAmountForCompanyCaixa(r, revenues, expenses, caseIds),
    0,
  );
  const sumAvulso = caixaRevYear
    .filter((r) => !r.invoiceId)
    .reduce(
      (a, r) => a + revenueAmountForCompanyCaixa(r, revenues, expenses, caseIds),
      0,
    );
  const sumVinculada = caixaRevYear
    .filter((r) => r.invoiceId)
    .reduce(
      (a, r) => a + revenueAmountForCompanyCaixa(r, revenues, expenses, caseIds),
      0,
    );

  const dre = calculateDre(invoices, revenues, expenses, year);

  const roiTagged = revYear.filter((r) => isProjectRoiOnlyTransaction(r));
  const softDel = revYear.filter((r) => isSoftDeleted(r));
  const estornos = revYear.filter((r) => r.isEstorno);
  const orphansNoTag = revYear.filter(
    (r) =>
      !isProjectRoiOnlyTransaction(r) &&
      !isSoftDeleted(r) &&
      !r.isEstorno &&
      (r.estornoDeId ||
        revenues.some((x) => x.estornoDeId === r.id) ||
        expenses.some((x) => x.estornoDeId === r.id)),
  );

  const suspiciousLarge = revYear
    .filter(
      (r) =>
        !isExcludedFromCompanyCaixa(r, revenues, expenses, caseIds) &&
        (Number(r.amount) || 0) >= 10_000,
    )
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));

  console.log('--- Totais ---');
  console.log(`Receitas brutas (todas, ${year}):     R$ ${sumRaw.toLocaleString('pt-BR')}`);
  console.log(`Caixa operacional líquido (${year}):   R$ ${sumCaixaNet.toLocaleString('pt-BR')}`);
  console.log(`  └ vinculadas a fatura:              R$ ${sumVinculada.toLocaleString('pt-BR')}`);
  console.log(`  └ avulsas (sem invoiceId):          R$ ${sumAvulso.toLocaleString('pt-BR')}`);
  console.log(`DRE receita bruta (fat + avulso):     R$ ${dre.receitaBruta.toLocaleString('pt-BR')}`);
  console.log(`DRE receita faturas pagas:            R$ ${dre.receitaFaturas.toLocaleString('pt-BR')}`);
  console.log(`DRE receita caixa total:              R$ ${dre.receitaCaixa.toLocaleString('pt-BR')}`);
  console.log(`DRE receita caixa avulsa:             R$ ${dre.receitaCaixaAvulsa.toLocaleString('pt-BR')}`);

  console.log('\n--- Excluídos do caixa ---');
  console.log(`Com projectRoiCaseId (${year}):       ${roiTagged.length} docs`);
  console.log(`Soft-deleted (${year}):               ${softDel.length} docs`);
  console.log(`Estornos (${year}):                   ${estornos.length} docs`);

  console.log('\n--- Suspeitos no caixa (>= R$ 10k) ---');
  for (const r of suspiciousLarge.slice(0, 20)) {
    console.log(
      `  ${r.date?.slice(0, 10)} · R$ ${Number(r.amount).toLocaleString('pt-BR')} · ${r.description?.slice(0, 50)} · invoice=${r.invoiceId || '-'} · roi=${r.projectRoiCaseId || '-'}`,
    );
  }

  if (orphansNoTag.length) {
    console.log('\n--- Possíveis órfãos ROI (sem tag, com estorno) ---');
    for (const r of orphansNoTag.slice(0, 15)) {
      console.log(
        `  ${r.id} · R$ ${Number(r.amount).toLocaleString('pt-BR')} · ${r.description?.slice(0, 50)}`,
      );
    }
  }

  console.log(`\nTotal docs revenues: ${revenues.length} (ano ${year}: ${revYear.length})`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
