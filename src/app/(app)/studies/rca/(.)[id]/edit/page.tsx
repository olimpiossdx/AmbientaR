'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditRcaModalView = dynamic(
  () =>
    import('./edit-rca-modal-view').then((m) => ({
      default: m.EditRcaModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function EditRcaModal() {
  return <EditRcaModalView />;
}
