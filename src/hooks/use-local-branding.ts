'use client';

import { useEffect, useMemo, useState } from 'react';
import { getApps } from 'firebase/app';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  clearBrandingPdfCache,
  fetchBrandingImagesForPdf,
  warmBrandingPdfCache,
  type BrandingPdfImages,
} from '@/lib/branding-pdf';

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
  const { firestore, auth } = useFirebase();
  const brandingRef = useMemoFirebase(
    () =>
      firestore && auth?.currentUser
        ? doc(firestore, 'companySettings', 'branding')
        : null,
    [firestore, auth?.currentUser?.uid],
  );
  const { data: brandingData, isLoading } = useDoc<Partial<LocalBranding>>(brandingRef);

  const data = useMemo<LocalBranding>(() => ({
    headerImageUrl: brandingData?.headerImageUrl ?? null,
    footerImageUrl: brandingData?.footerImageUrl ?? null,
    watermarkImageUrl: brandingData?.watermarkImageUrl ?? null,
    logoUsage: brandingData?.logoUsage ?? 'pdf_only',
    systemLogoSource: brandingData?.systemLogoSource ?? 'header',
  }), [brandingData]);

  const [pdfImages, setPdfImages] = useState<BrandingPdfImages | null>(null);
  const [isPdfImagesLoading, setIsPdfImagesLoading] = useState(false);
  const [pdfImagesReloadToken, setPdfImagesReloadToken] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    warmBrandingPdfCache(data);
  }, [isLoading, data]);

  useEffect(() => {
    if (isLoading || !auth?.currentUser) return;
    const hasUrl =
      Boolean(data.headerImageUrl?.trim()) ||
      Boolean(data.footerImageUrl?.trim()) ||
      Boolean(data.watermarkImageUrl?.trim());
    if (!hasUrl) {
      setPdfImages({ headerBase64: null, footerBase64: null, watermarkBase64: null });
      setIsPdfImagesLoading(false);
      return;
    }
    let cancelled = false;
    setIsPdfImagesLoading(true);

    const load = async () => {
      if (typeof getApps === 'function') {
        for (let i = 0; i < 100 && getApps().length === 0; i++) {
          await new Promise((r) => setTimeout(r, 80));
          if (cancelled) return;
        }
      }
      try {
        const loaded = await fetchBrandingImagesForPdf({
          headerImageUrl: data.headerImageUrl,
          footerImageUrl: data.footerImageUrl,
          watermarkImageUrl: data.watermarkImageUrl,
        });
        if (!cancelled) setPdfImages(loaded);
      } catch {
        if (!cancelled) {
          setPdfImages({ headerBase64: null, footerBase64: null, watermarkBase64: null });
        }
      } finally {
        if (!cancelled) setIsPdfImagesLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    isLoading,
    auth?.currentUser?.uid,
    data.headerImageUrl,
    data.footerImageUrl,
    data.watermarkImageUrl,
    pdfImagesReloadToken,
  ]);

  const refetch = () => {
    clearBrandingPdfCache();
    setPdfImages(null);
    setPdfImagesReloadToken((n) => n + 1);
  };

  const hasBrandingUrls =
    Boolean(data.headerImageUrl?.trim()) ||
    Boolean(data.footerImageUrl?.trim()) ||
    Boolean(data.watermarkImageUrl?.trim());

  return {
    data: data ?? empty,
    isLoading,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
    refetch,
  };
}
