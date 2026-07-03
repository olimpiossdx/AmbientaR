'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewRcaModalView = dynamic(
  () =>
    import('./new-rca-modal-view').then((m) => ({
      default: m.NewRcaModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function NewRcaModal() {
  return <NewRcaModalView />;
}
