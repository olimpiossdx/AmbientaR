'use client';

import dynamic from 'next/dynamic';
import { ResponsibleFormModalSuspenseFallback } from '../../responsible-form-shell';

const EditResponsibleModalView = dynamic(
  () =>
    import('./edit-responsible-modal-view').then((m) => ({
      default: m.EditResponsibleModalView,
    })),
  { ssr: false, loading: () => <ResponsibleFormModalSuspenseFallback /> },
);

export default function EditResponsibleModal() {
  return <EditResponsibleModalView />;
}
