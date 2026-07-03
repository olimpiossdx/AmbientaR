'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditPiaModalView = dynamic(
  () => import('./edit-pia-modal-view').then((m) => ({ default: m.EditPiaModalView })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function EditPiaModal() {
  return <EditPiaModalView />;
}
