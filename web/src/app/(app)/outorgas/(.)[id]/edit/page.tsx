'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditOutorgaModalView = dynamic(
  () =>
    import('./edit-outorga-modal-view').then((m) => ({
      default: m.EditOutorgaModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function EditOutorgaModal() {
  return <EditOutorgaModalView />;
}
