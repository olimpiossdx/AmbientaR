'use client';

import dynamic from 'next/dynamic';
import { CompanyFormModalSuspenseFallback } from '../../company-form-shell';

const EditCompanyModalView = dynamic(
  () =>
    import('./edit-company-modal-view').then((m) => ({
      default: m.EditCompanyModalView,
    })),
  { ssr: false, loading: () => <CompanyFormModalSuspenseFallback /> },
);

export default function EditCompanyModal() {
  return <EditCompanyModalView />;
}
