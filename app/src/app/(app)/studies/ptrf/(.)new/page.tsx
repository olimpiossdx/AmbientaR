'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewPtrfModalView = dynamic(
  () => import('./new-ptrf-modal-view').then((m) => ({ default: m.NewPtrfModalView })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function NewPtrfModal() {
  return <NewPtrfModalView />;
}
