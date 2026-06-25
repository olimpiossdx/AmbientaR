'use client';

import dynamic from 'next/dynamic';
import { InvoiceFormModalSuspenseFallback } from '../invoice-form-shell';

const NewInvoiceModalView = dynamic(
  () =>
    import('./new-invoice-modal-view').then((m) => ({
      default: m.NewInvoiceModalView,
    })),
  {
    ssr: false,
    loading: () => <InvoiceFormModalSuspenseFallback />,
  },
);

export default function NewInvoiceModal() {
  return <NewInvoiceModalView />;
}
