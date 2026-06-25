'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const EditPcaModalView = dynamic(
  () =>
    import('./edit-pca-modal-view').then((m) => ({
      default: m.EditPcaModalView,
    })),
  {
    ssr: false,
    loading: () => <StudyFormModalSuspenseFallback />,
  },
);

export default function EditPcaModal() {
  return <EditPcaModalView />;
}
