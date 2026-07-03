'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewEiaRimaModalView = dynamic(
  () =>
    import('./new-eia-rima-modal-view').then((m) => ({
      default: m.NewEiaRimaModalView,
    })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function NewEiaRimaModal() {
  return <NewEiaRimaModalView />;
}
