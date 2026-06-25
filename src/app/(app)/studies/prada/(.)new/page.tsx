'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const NewPradaModalView = dynamic(
  () => import('./new-prada-modal-view').then((m) => ({ default: m.NewPradaModalView })),
  { ssr: false, loading: () => <StudyFormModalSuspenseFallback /> },
);

export default function NewPradaModal() {
  return <NewPradaModalView />;
}
