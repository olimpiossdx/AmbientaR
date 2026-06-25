'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const EditEiaRimaModalView = dynamic(
  () =>
    import('./edit-eia-rima-modal-view').then((m) => ({
      default: m.EditEiaRimaModalView,
    })),
  { ssr: false, loading: () => <StudyFormModalSuspenseFallback /> },
);

export default function EditEiaRimaModal() {
  return <EditEiaRimaModalView />;
}
