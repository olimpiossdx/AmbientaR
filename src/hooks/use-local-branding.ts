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
import {
  getBrandingMissingSlots,
  hasCompleteBrandingImages,
  hasCompleteBrandingUrls,
} from '@/lib/branding/requirements';

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

const BRANDING_LOAD_RETRIES = 2;
const BRANDING_RETRY_DELAY_MS = 600;

async function loadBrandingWithRetries(urls: {
  headerImageUrl: string | null;
  footerImageUrl: string | null;
  watermarkImageUrl: string | null;
}): Promise<BrandingPdfImages> {
  let last: BrandingPdfImages = {
    headerBase64: null,
    footerBase64: null,
    watermarkBase64: null,
  };
  for (let attempt = 0; attempt <= BRANDING_LOAD_RETRIES; attempt++) {
    if (attempt > 0) {
      clearBrandingPdfCache();
      await new Promise((r) => setTimeout(r, BRANDING_RETRY_DELAY_MS * attempt));
    }
    last = await fetchBrandingImagesForPdf({
      headerImageUrl: urls.headerImageUrl,
      footerImageUrl: urls.footerImageUrl,
      watermarkImageUrl: urls.watermarkImageUrl,
    });
    if (hasCompleteBrandingImages(last)) return last;
  }
  return last;
}

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
  const [isFetchingPdfImages, setIsFetchingPdfImages] = useState(false);
  const [pdfImagesReloadToken, setPdfImagesReloadToken] = useState(0);

  const hasBrandingUrls = hasCompleteBrandingUrls(data);
  const isSessionReady = Boolean(auth?.currentUser);
  const isPdfImagesLoading = isLoading || !isSessionReady || isFetchingPdfImages;
  const isBrandingReady =
    hasBrandingUrls && Boolean(pdfImages) && hasCompleteBrandingImages(pdfImages!);
  const brandingMissingSlots = useMemo(() => {
    if (!hasBrandingUrls) return [] as string[];
    return getBrandingMissingSlots(
      {
        headerImageUrl: data.headerImageUrl,
        footerImageUrl: data.footerImageUrl,
        watermarkImageUrl: data.watermarkImageUrl,
      },
      pdfImages ?? {
        headerBase64: null,
        footerBase64: null,
        watermarkBase64: null,
      },
    );
  }, [hasBrandingUrls, data, pdfImages]);

  useEffect(() => {
    if (isLoading) return;
    warmBrandingPdfCache(data);
  }, [isLoading, data]);

  useEffect(() => {
    if (isLoading) return;

    if (!isSessionReady) {
      setPdfImages(null);
      setIsFetchingPdfImages(hasBrandingUrls);
      return;
    }

    if (!hasBrandingUrls) {
      setPdfImages({ headerBase64: null, footerBase64: null, watermarkBase64: null });
      setIsFetchingPdfImages(false);
      return;
    }

    let cancelled = false;
    setIsFetchingPdfImages(true);

    const load = async () => {
      if (typeof getApps === 'function') {
        for (let i = 0; i < 100 && getApps().length === 0; i++) {
          await new Promise((r) => setTimeout(r, 80));
          if (cancelled) return;
        }
      }
      try {
        const loaded = await loadBrandingWithRetries(data);
        if (!cancelled) setPdfImages(loaded);
      } catch {
        if (!cancelled) {
          setPdfImages({ headerBase64: null, footerBase64: null, watermarkBase64: null });
        }
      } finally {
        if (!cancelled) setIsFetchingPdfImages(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isSessionReady, hasBrandingUrls, data, pdfImagesReloadToken]);

  const refetch = () => {
    clearBrandingPdfCache();
    setPdfImages(null);
    setPdfImagesReloadToken((n) => n + 1);
  };

  return {
    data: data ?? empty,
    isLoading,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
    isBrandingReady,
    brandingMissingSlots,
    refetch,
  };
}
