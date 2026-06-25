'use client';

import dynamic from 'next/dynamic';
import { StudyFormModalSuspenseFallback } from '@/components/studies/study-form-shell';

const NewEiaRimaModalView = dynamic(
  () =>
    import('./new-eia-rima-modal-view').then((m) => ({
      default: m.NewEiaRimaModalView,
    })),
  { ssr: false, loading: () => <StudyFormModalSuspenseFallback /> },
);

export default function NewEiaRimaModal() {
  return <NewEiaRimaModalView />;
}
