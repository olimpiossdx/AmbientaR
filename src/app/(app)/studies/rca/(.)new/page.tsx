'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const NewRcaModalView = dynamic(
  () =>
    import('./new-rca-modal-view').then((m) => ({
      default: m.NewRcaModalView,
    })),
  {
    ssr: false,
    loading: () => <StudyFormModalSuspenseFallback />,
  },
);

export default function NewRcaModal() {
  return <NewRcaModalView />;
}
