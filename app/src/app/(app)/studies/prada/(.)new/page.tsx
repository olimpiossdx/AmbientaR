'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewPradaModalView = dynamic(
  () => import('./new-prada-modal-view').then((m) => ({ default: m.NewPradaModalView })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function NewPradaModal() {
  return <NewPradaModalView />;
}
