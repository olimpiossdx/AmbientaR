'use client';

import dynamic from 'next/dynamic';
import { OutorgaFormModalSuspenseFallback } from '../../outorga-form-shell';

const EditOutorgaModalView = dynamic(
  () =>
    import('./edit-outorga-modal-view').then((m) => ({
      default: m.EditOutorgaModalView,
    })),
  {
    ssr: false,
    loading: () => <OutorgaFormModalSuspenseFallback />,
  },
);

export default function EditOutorgaModal() {
  return <EditOutorgaModalView />;
}
