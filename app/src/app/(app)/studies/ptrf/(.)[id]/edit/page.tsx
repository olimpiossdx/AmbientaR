'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditPtrfModalView = dynamic(
  () => import('./edit-ptrf-modal-view').then((m) => ({ default: m.EditPtrfModalView })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function EditPtrfModal() {
  return <EditPtrfModalView />;
}
