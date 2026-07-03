import type { BrandingImageUrls, BrandingPdfImages } from '@/lib/branding-pdf';
import { brandingPdfMissingSlots } from '@/lib/branding-pdf';

export const BRANDING_SETUP_PATH = 'Configurações → Identidade visual';

export const BRANDING_REQUIRED_MESSAGE =
  `Configure cabeçalho, rodapé e marca d'água em ${BRANDING_SETUP_PATH} (utilizador administrador).`;

/** URLs das três imagens obrigatórias para exportação oficial. */
export function hasCompleteBrandingUrls(
  branding:
    | BrandingImageUrls
    | {
        headerImageUrl?: string | null;
        footerImageUrl?: string | null;
        watermarkImageUrl?: string | null;
      }
    | null
    | undefined,
): boolean {
  return (
    Boolean(branding?.headerImageUrl?.trim()) &&
    Boolean(branding?.footerImageUrl?.trim()) &&
    Boolean(branding?.watermarkImageUrl?.trim())
  );
}

/** Três imagens carregadas em base64 (slots configurados). */
export function hasCompleteBrandingImages(loaded: BrandingPdfImages): boolean {
  return (
    Boolean(loaded.headerBase64) &&
    Boolean(loaded.footerBase64) &&
    Boolean(loaded.watermarkBase64)
  );
}

export function getBrandingMissingSlots(
  urls: BrandingImageUrls,
  loaded: BrandingPdfImages,
): string[] {
  return brandingPdfMissingSlots(urls, loaded);
}
