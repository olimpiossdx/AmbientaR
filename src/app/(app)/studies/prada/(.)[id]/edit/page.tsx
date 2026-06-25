'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const EditPradaModalView = dynamic(
  () => import('./edit-prada-modal-view').then((m) => ({ default: m.EditPradaModalView })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function EditPradaModal() {
  return <EditPradaModalView />;
}
