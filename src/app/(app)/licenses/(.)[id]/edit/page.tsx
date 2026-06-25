'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditLicenseModalView = dynamic(
  () =>
    import('./edit-license-modal-view').then((m) => ({
      default: m.EditLicenseModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function EditLicenseModal() {
  return <EditLicenseModalView />;
}
