'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditInvoiceModalView = dynamic(
  () =>
    import('./edit-invoice-modal-view').then((m) => ({
      default: m.EditInvoiceModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function EditInvoiceModal() {
  return <EditInvoiceModalView />;
}
