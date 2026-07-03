'use client';

import dynamic from 'next/dynamic';
import { InterceptModalLoading } from '@/components/intercept-modal-loading';

const NewPiaModalView = dynamic(
  () => import('./new-pia-modal-view').then((m) => ({ default: m.NewPiaModalView })),
  { ssr: false, loading: () => <InterceptModalLoading /> },
);

export default function NewPiaModal() {
  return <NewPiaModalView />;
}
