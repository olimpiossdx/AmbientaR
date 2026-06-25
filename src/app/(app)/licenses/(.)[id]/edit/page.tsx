'use client';

import dynamic from 'next/dynamic';
import { LicenseFormModalSuspenseFallback } from '../../license-form-shell';

const EditLicenseModalView = dynamic(
  () =>
    import('./edit-license-modal-view').then((m) => ({
      default: m.EditLicenseModalView,
    })),
  {
    ssr: false,
    loading: () => <LicenseFormModalSuspenseFallback />,
  },
);

export default function EditLicenseModal() {
  return <EditLicenseModalView />;
}
