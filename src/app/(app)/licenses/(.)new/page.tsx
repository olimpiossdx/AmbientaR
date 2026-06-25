'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewLicenseModalView = dynamic(
  () =>
    import('./new-license-modal-view').then((m) => ({
      default: m.NewLicenseModalView,
    })),
  {
    ssr: false,
    loading: () => <InterceptModalLoading />,
  },
);

export default function NewLicenseModal() {
  return <NewLicenseModalView />;
}
