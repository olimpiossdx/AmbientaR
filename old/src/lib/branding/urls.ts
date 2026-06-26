import type { BrandingImageUrls } from '@/lib/branding-pdf';

export function brandingUrlsFromLocal(
  branding:
    | BrandingImageUrls
    | {
        headerImageUrl?: string | null;
        footerImageUrl?: string | null;
        watermarkImageUrl?: string | null;
      }
    | null
    | undefined,
): BrandingImageUrls {
  return {
    headerImageUrl: branding?.headerImageUrl,
    footerImageUrl: branding?.footerImageUrl,
    watermarkImageUrl: branding?.watermarkImageUrl,
  };
}
