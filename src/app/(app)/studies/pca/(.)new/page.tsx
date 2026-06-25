'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewPcaModalView = dynamic(
  () =>
    import('./new-pca-modal-view').then((m) => ({
      default: m.NewPcaModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function NewPcaModal() {
  return <NewPcaModalView />;
}
