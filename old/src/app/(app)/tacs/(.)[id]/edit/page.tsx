'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditTacModalView = dynamic(
  () =>
    import('./edit-tac-modal-view').then((m) => ({
      default: m.EditTacModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function EditTacModal() {
  return <EditTacModalView />;
}
