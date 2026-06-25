'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const EditRcaModalView = dynamic(
  () =>
    import('./edit-rca-modal-view').then((m) => ({
      default: m.EditRcaModalView,
    })),
  {
    ssr: false,
    loading: () => <StudyFormModalSuspenseFallback />,
  },
);

export default function EditRcaModal() {
  return <EditRcaModalView />;
}
