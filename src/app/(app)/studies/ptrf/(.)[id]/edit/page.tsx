'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const EditPtrfModalView = dynamic(
  () => import('./edit-ptrf-modal-view').then((m) => ({ default: m.EditPtrfModalView })),
  { ssr: false, loading: () => <StudyFormModalSuspenseFallback /> },
);

export default function EditPtrfModal() {
  return <EditPtrfModalView />;
}
