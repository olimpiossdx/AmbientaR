'use client';

import { useMemo } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export type LocalBranding = {
  headerImageUrl: string | null;
  footerImageUrl: string | null;
  watermarkImageUrl: string | null;
  logoUsage?: 'pdf_only' | 'system_wide';
  systemLogoSource?: 'header' | 'watermark';
};

const empty: LocalBranding = {
  headerImageUrl: null,
  footerImageUrl: null,
  watermarkImageUrl: null,
  logoUsage: 'pdf_only',
  systemLogoSource: 'header',
};

export function useLocalBranding() {
  const { firestore } = useFirebase();
  const brandingRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'companySettings', 'branding') : null),
    [firestore]
  );
  const { data: brandingData, isLoading } = useDoc<Partial<LocalBranding>>(brandingRef);

  const data = useMemo<LocalBranding>(() => ({
    headerImageUrl: brandingData?.headerImageUrl ?? null,
    footerImageUrl: brandingData?.footerImageUrl ?? null,
    watermarkImageUrl: brandingData?.watermarkImageUrl ?? null,
    logoUsage: brandingData?.logoUsage ?? 'pdf_only',
    systemLogoSource: brandingData?.systemLogoSource ?? 'header',
  }), [brandingData]);

  return { data: data ?? empty, isLoading, refetch: () => {} };
}
