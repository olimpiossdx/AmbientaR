'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const EditPradaModalView = dynamic(
  () => import('./edit-prada-modal-view').then((m) => ({ default: m.EditPradaModalView })),
  { ssr: false, loading: () => <StudyFormModalSuspenseFallback /> },
);

export default function EditPradaModal() {
  return <EditPradaModalView />;
}
