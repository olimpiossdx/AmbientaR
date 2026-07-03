'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditPcaModalView = dynamic(
  () =>
    import('./edit-pca-modal-view').then((m) => ({
      default: m.EditPcaModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function EditPcaModal() {
  return <EditPcaModalView />;
}
