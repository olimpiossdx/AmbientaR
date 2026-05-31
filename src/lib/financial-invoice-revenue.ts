import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Invoice } from '@/lib/types';
import { findCaseByContractId } from '@/lib/project-roi-case-queries';

/** Cria receita de caixa vinculada à fatura (evita dupla contagem na DRE). */
export async function createRevenueFromPaidInvoice(
  firestore: Firestore,
  invoice: Invoice,
  invoiceDocId: string,
): Promise<string> {
  const existing = await getDocs(
    query(
      collection(firestore, 'revenues'),
      where('invoiceId', '==', invoiceDocId),
    ),
  );
  if (!existing.empty) {
    return existing.docs[0].id;
  }

  let projectRoiCaseId = invoice.projectRoiCaseId || '';
  if (!projectRoiCaseId && invoice.contractId) {
    const linked = await findCaseByContractId(firestore, invoice.contractId);
    if (linked) projectRoiCaseId = linked.id;
  }

  const ref = await addDoc(collection(firestore, 'revenues'), {
    clientId: invoice.clientId,
    date: invoice.invoiceDate || new Date().toISOString(),
    amount: invoice.amount,
    description: `Recebimento fatura ${invoice.invoiceNumber}`,
    fileUrl: invoice.fileUrl || '',
    invoiceId: invoiceDocId,
    contractId: invoice.contractId || '',
    requestId: invoice.requestId || '',
    projectId: invoice.projectId || '',
    centroCusto: invoice.centroCusto || '',
    projectRoiCaseId: projectRoiCaseId || '',
  });
  return ref.id;
}
