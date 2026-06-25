'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const NewPtrfModalView = dynamic(
  () => import('./new-ptrf-modal-view').then((m) => ({ default: m.NewPtrfModalView })),
  { ssr: false, loading: () => <StudyFormModalSuspenseFallback /> },
);

export default function NewPtrfModal() {
  return <NewPtrfModalView />;
}
