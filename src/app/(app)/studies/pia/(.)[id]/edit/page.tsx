'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const EditPiaModalView = dynamic(
  () => import('./edit-pia-modal-view').then((m) => ({ default: m.EditPiaModalView })),
  { ssr: false, loading: () => <StudyFormModalSuspenseFallback /> },
);

export default function EditPiaModal() {
  return <EditPiaModalView />;
}
