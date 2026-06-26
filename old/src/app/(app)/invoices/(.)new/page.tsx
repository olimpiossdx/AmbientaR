'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewInvoiceModalView = dynamic(
  () =>
    import('./new-invoice-modal-view').then((m) => ({
      default: m.NewInvoiceModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function NewInvoiceModal() {
  return <NewInvoiceModalView />;
}
