/**
 * Soft-delete lançamentos gerenciais ROI órfãos e estornos legados no Firestore.
 * Uso: npx tsx scripts/migrate-soft-delete-roi-orphans.ts [--dry-run|--apply]
 */
import {
  isRoiGerencialEstorno,
  isSoftDeleted,
} from '../src/lib/financial-transaction-scope';
import type { Expense, Revenue } from '../src/lib/types';
import { adminDb } from '../src/lib/firebase-admin';

type TxKind = 'revenue' | 'expense';

type TxRef = { id: string; kind: TxKind };

const MIGRATION_UID = 'migration_roi_cleanup';
const JUSTIFICATION_ORPHAN =
  'Migração: lançamento órfão de Projetos & ROI — caso excluído ou desvinculado';
const JUSTIFICATION_ESTORNO =
  'Migração: estorno legado de Projetos & ROI substituído por exclusão com justificativa';

function asRevenue(id: string, data: Record<string, unknown>): Revenue {
  return { id, ...(data as Omit<Revenue, 'id'>) };
}

function asExpense(id: string, data: Record<string, unknown>): Expense {
  return { id, ...(data as Omit<Expense, 'id'>) };
}

function shouldMigrate(
  item: Revenue | Expense,
  revenues: Revenue[],
  expenses: Expense[],
  caseIds: Set<string>,
): boolean {
  if (isSoftDeleted(item)) return false;
  const caseId = item.projectRoiCaseId?.trim();
  if (caseId && !caseIds.has(caseId)) return true;
  if (isRoiGerencialEstorno(item, revenues, expenses)) return true;
  if (item.isEstorno) return true;
  return false;
}

function collectMigrationTargets(
  revenues: Revenue[],
  expenses: Expense[],
  caseIds: Set<string>,
): Map<string, TxRef> {
  const targets = new Map<string, TxRef>();

  const mark = (id: string, kind: TxKind) => {
    targets.set(id, { id, kind });
  };

  for (const r of revenues) {
    if (shouldMigrate(r, revenues, expenses, caseIds)) mark(r.id, 'revenue');
  }
  for (const e of expenses) {
    if (shouldMigrate(e, revenues, expenses, caseIds)) mark(e.id, 'expense');
  }

  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const r of revenues) {
      if (isSoftDeleted(r) || targets.has(r.id)) continue;
      if (r.estornadoPorId && targets.has(r.estornadoPorId)) {
        mark(r.id, 'revenue');
        expanded = true;
      }
      if (
        expenses.some((e) => e.estornoDeId === r.id && targets.has(e.id)) ||
        revenues.some((x) => x.estornoDeId === r.id && targets.has(x.id))
      ) {
        mark(r.id, 'revenue');
        expanded = true;
      }
    }
    for (const e of expenses) {
      if (isSoftDeleted(e) || targets.has(e.id)) continue;
      if (e.estornadoPorId && targets.has(e.estornadoPorId)) {
        mark(e.id, 'expense');
        expanded = true;
      }
      if (
        revenues.some((r) => r.estornoDeId === e.id && targets.has(r.id)) ||
        expenses.some((x) => x.estornoDeId === e.id && targets.has(x.id))
      ) {
        mark(e.id, 'expense');
        expanded = true;
      }
    }
  }

  return targets;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const dryRun = !apply || process.argv.includes('--dry-run');

  console.log(
    `=== migrate-soft-delete-roi-orphans (${dryRun ? 'DRY-RUN' : 'APPLY'}) ===\n`,
  );

  const caseSnap = await adminDb().collection('project_roi_cases').get();
  const caseIds = new Set(caseSnap.docs.map((d) => d.id));
  console.log(`Casos ROI ativos: ${caseIds.size}`);

  const [revSnap, expSnap] = await Promise.all([
    adminDb().collection('revenues').get(),
    adminDb().collection('expenses').get(),
  ]);

  const revenues = revSnap.docs.map((d) => asRevenue(d.id, d.data()));
  const expenses = expSnap.docs.map((d) => asExpense(d.id, d.data()));

  const targets = collectMigrationTargets(revenues, expenses, caseIds);
  console.log(`Lançamentos a soft-delete: ${targets.size}`);

  if (targets.size === 0) {
    console.log('Nada a migrar.');
    return;
  }

  const now = new Date().toISOString();
  let batch = adminDb().batch();
  let ops = 0;

  for (const { id, kind } of targets.values()) {
    const item =
      kind === 'revenue'
        ? revenues.find((r) => r.id === id)
        : expenses.find((e) => e.id === id);
    if (!item) continue;

    const justification = item.isEstorno
      ? JUSTIFICATION_ESTORNO
      : JUSTIFICATION_ORPHAN;

    console.log(
      `[${dryRun ? 'dry' : 'apply'}] ${kind} ${id} · ${item.description?.slice(0, 60)} · R$ ${item.amount}`,
    );

    if (!dryRun) {
      const coll = kind === 'revenue' ? 'revenues' : 'expenses';
      batch.update(adminDb().collection(coll).doc(id), {
        deletedAt: now,
        deletedByUid: MIGRATION_UID,
        deleteJustification: justification,
      });
      ops += 1;
      if (ops >= 400) {
        await batch.commit();
        batch = adminDb().batch();
        ops = 0;
      }
    }
  }

  if (!dryRun && ops > 0) {
    await batch.commit();
  }

  if (!dryRun) {
    await adminDb().collection('auditLogs').add({
    userId: MIGRATION_UID,
    userName: 'Migração ROI',
    action: 'migration_soft_delete_roi',
    details: {
      count: targets.size,
      dryRun,
    },
    timestamp: new Date(),
    });
  }

  console.log(dryRun ? '\nDry-run concluído. Use --apply para gravar.' : '\nMigração aplicada.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
