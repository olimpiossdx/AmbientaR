'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditResponsibleModalView = dynamic(
  () =>
    import('./edit-responsible-modal-view').then((m) => ({
      default: m.EditResponsibleModalView,
    })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function EditResponsibleModal() {
  return <EditResponsibleModalView />;
}
