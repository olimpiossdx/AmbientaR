'use client';

import dynamic from 'next/dynamic';
import { LicenseFormModalSuspenseFallback } from '../license-form-shell';

const NewLicenseModalView = dynamic(
  () =>
    import('./new-license-modal-view').then((m) => ({
      default: m.NewLicenseModalView,
    })),
  {
    ssr: false,
    loading: () => <LicenseFormModalSuspenseFallback />,
  },
);

export default function NewLicenseModal() {
  return <NewLicenseModalView />;
}
