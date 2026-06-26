'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewOutorgaModalView = dynamic(
  () =>
    import('./new-outorga-modal-view').then((m) => ({
      default: m.NewOutorgaModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function NewOutorgaModal() {
  return <NewOutorgaModalView />;
}
