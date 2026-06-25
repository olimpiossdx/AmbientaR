'use client';

import dynamic from 'next/dynamic';
import { OutorgaFormModalSuspenseFallback } from '../outorga-form-shell';

const NewOutorgaModalView = dynamic(
  () =>
    import('./new-outorga-modal-view').then((m) => ({
      default: m.NewOutorgaModalView,
    })),
  {
    ssr: false,
    loading: () => <OutorgaFormModalSuspenseFallback />,
  },
);

export default function NewOutorgaModal() {
  return <NewOutorgaModalView />;
}
