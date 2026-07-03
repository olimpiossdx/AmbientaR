'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditCompanyModalView = dynamic(
  () =>
    import('./edit-company-modal-view').then((m) => ({
      default: m.EditCompanyModalView,
    })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function EditCompanyModal() {
  return <EditCompanyModalView />;
}
