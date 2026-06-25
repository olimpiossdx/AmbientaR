'use client';

import dynamic from 'next/dynamic';
import { ResponsibleFormModalSuspenseFallback } from '../responsible-form-shell';

const NewResponsibleModalView = dynamic(
  () =>
    import('./new-responsible-modal-view').then((m) => ({
      default: m.NewResponsibleModalView,
    })),
  { ssr: false, loading: () => <ResponsibleFormModalSuspenseFallback /> },
);

export default function NewResponsibleModal() {
  return <NewResponsibleModalView />;
}
