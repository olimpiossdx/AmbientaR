'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewResponsibleModalView = dynamic(
  () =>
    import('./new-responsible-modal-view').then((m) => ({
      default: m.NewResponsibleModalView,
    })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function NewResponsibleModal() {
  return <NewResponsibleModalView />;
}
