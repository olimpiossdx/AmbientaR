'use client';

import dynamic from 'next/dynamic';
import { CompanyFormModalSuspenseFallback } from '../company-form-shell';

const NewCompanyModalView = dynamic(
  () =>
    import('./new-company-modal-view').then((m) => ({
      default: m.NewCompanyModalView,
    })),
  { ssr: false, loading: () => <CompanyFormModalSuspenseFallback /> },
);

export default function NewCompanyModal() {
  return <NewCompanyModalView />;
}
