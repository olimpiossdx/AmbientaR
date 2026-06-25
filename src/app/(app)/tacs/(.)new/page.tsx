'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewTacModalView = dynamic(
  () =>
    import('./new-tac-modal-view').then((m) => ({
      default: m.NewTacModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function NewTacModal() {
  return <NewTacModalView />;
}
