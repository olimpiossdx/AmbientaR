'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewCompanyModalView = dynamic(
  () =>
    import('./new-company-modal-view').then((m) => ({
      default: m.NewCompanyModalView,
    })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function NewCompanyModal() {
  return <NewCompanyModalView />;
}
