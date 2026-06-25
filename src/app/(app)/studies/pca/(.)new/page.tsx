'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const NewPcaModalView = dynamic(
  () =>
    import('./new-pca-modal-view').then((m) => ({
      default: m.NewPcaModalView,
    })),
  {
    ssr: false,
    loading: () => <StudyFormModalSuspenseFallback />,
  },
);

export default function NewPcaModal() {
  return <NewPcaModalView />;
}
