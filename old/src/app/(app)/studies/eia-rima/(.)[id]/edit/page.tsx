'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditEiaRimaModalView = dynamic(
  () =>
    import('./edit-eia-rima-modal-view').then((m) => ({
      default: m.EditEiaRimaModalView,
    })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function EditEiaRimaModal() {
  return <EditEiaRimaModalView />;
}
