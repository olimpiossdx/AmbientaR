'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const NewPiaModalView = dynamic(
  () => import('./new-pia-modal-view').then((m) => ({ default: m.NewPiaModalView })),
  { ssr: false, loading: () => <StudyFormModalSuspenseFallback /> },
);

export default function NewPiaModal() {
  return <NewPiaModalView />;
}
