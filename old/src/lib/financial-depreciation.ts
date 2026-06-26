import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { BemPatrimonio } from '@/lib/types';
import { monthlyDepreciationAmount } from '@/lib/financial-core';

/** Aplica depreciação mensal de todos os bens ativos e opcionalmente cria despesa. */
export async function runMonthlyDepreciationForAll(
  firestore: Firestore,
  options: { createExpense?: boolean; competencia?: string } = {},
): Promise<{ processed: number; totalDepreciation: number }> {
  const { getDocs } = await import('firebase/firestore');
  const snap = await getDocs(collection(firestore, 'bens_patrimonio'));
  const competencia =
    options.competencia || new Date().toISOString().slice(0, 7);
  let processed = 0;
  let totalDepreciation = 0;

  for (const d of snap.docs) {
    const bem = { id: d.id, ...d.data() } as BemPatrimonio;
    if (bem.status !== 'ativo' || bem.metodoDepreciacao === 'nao_depreciavel') continue;

    const mensal = monthlyDepreciationAmount(bem);
    if (mensal <= 0) continue;

    const novaAcumulada = (bem.depreciacaoAcumulada ?? 0) + mensal;
    await updateDoc(doc(firestore, 'bens_patrimonio', bem.id), {
      depreciacaoAcumulada: novaAcumulada,
      updatedAt: new Date().toISOString(),
      lastDepreciationCompetencia: competencia,
    });

    if (options.createExpense) {
      await addDoc(collection(firestore, 'expenses'), {
        date: new Date().toISOString(),
        amount: mensal,
        description: `Depreciação ${bem.descricao} (${competencia})`,
        category: 'depreciacao',
        depreciacaoBemId: bem.id,
        bensPatrimonioId: bem.id,
        centroCusto: bem.centroCusto || '',
      });
    }

    processed += 1;
    totalDepreciation += mensal;
  }

  return { processed, totalDepreciation };
}
