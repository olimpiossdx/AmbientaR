'use client';

import dynamic from 'next/dynamic';
import { InvoiceFormModalSuspenseFallback } from '../../invoice-form-shell';

const EditInvoiceModalView = dynamic(
  () =>
    import('./edit-invoice-modal-view').then((m) => ({
      default: m.EditInvoiceModalView,
    })),
  {
    ssr: false,
    loading: () => <InvoiceFormModalSuspenseFallback />,
  },
);

export default function EditInvoiceModal() {
  return <EditInvoiceModalView />;
}
