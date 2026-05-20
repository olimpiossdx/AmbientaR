'use client';

import { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import type { Invoice } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { computeOverdueInvoiceUpdates } from '@/lib/financial-core';

/**
 * Atualiza no Firestore faturas Unpaid com vencimento passado → Overdue.
 * Executa no máximo uma vez por sessão (admin/financial).
 */
export function useSyncOverdueInvoices(
  invoices: Invoice[] | undefined,
  enabled: boolean,
) {
  const { firestore } = useFirebase();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !firestore || !invoices?.length || syncedRef.current) return;
    const updates = computeOverdueInvoiceUpdates(invoices);
    if (updates.length === 0) return;
    syncedRef.current = true;
    void (async () => {
      for (const u of updates) {
        try {
          await updateDoc(doc(firestore, 'invoices', u.id), { status: u.status });
        } catch {
          /* permissão ou offline — ignorar */
        }
      }
    })();
  }, [enabled, firestore, invoices]);
}
