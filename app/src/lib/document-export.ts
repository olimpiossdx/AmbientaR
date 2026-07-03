import type { BrandingImageUrls, BrandingPdfImages } from '@/lib/branding-pdf';
import { brandingUrlsFromLocal } from '@/lib/branding/urls';
import type { BrandingPdfToastReporter } from '@/lib/pdf-branding-layout';
import {
  BRANDING_REQUIRED_MESSAGE,
  BRANDING_SETUP_PATH,
  getBrandingMissingSlots,
  hasCompleteBrandingImages,
  hasCompleteBrandingUrls,
} from '@/lib/branding/requirements';

export {
  BRANDING_REQUIRED_MESSAGE,
  BRANDING_SETUP_PATH,
  hasCompleteBrandingUrls,
  hasCompleteBrandingImages,
};

export type OfficialExportGuardContext = {
  brandingData:
    | {
        headerImageUrl?: string | null;
        footerImageUrl?: string | null;
        watermarkImageUrl?: string | null;
      }
    | null
    | undefined;
  pdfImages?: BrandingPdfImages | null;
  isPdfImagesLoading: boolean;
  toast?: BrandingPdfToastReporter;
  formatLabel?: string;
};

/**
 * Bloqueia exportação oficial se identidade visual incompleta (fail-closed).
 * Exige cabeçalho, rodapé e marca d'água configurados e carregados.
 */
export function guardOfficialDocumentExport(ctx: OfficialExportGuardContext): boolean {
  const formatLabel = ctx.formatLabel ?? 'documento';
  const urls = brandingUrlsFromLocal(ctx.brandingData);

  if (ctx.isPdfImagesLoading) {
    ctx.toast?.({
      title: 'Aguarde',
      description: `Carregando imagens da identidade visual para o ${formatLabel}…`,
    });
    return false;
  }

  if (!hasCompleteBrandingUrls(urls)) {
    ctx.toast?.({
      variant: 'destructive',
      title: 'Identidade visual obrigatória',
      description: BRANDING_REQUIRED_MESSAGE,
    });
    return false;
  }

  if (!ctx.pdfImages || !hasCompleteBrandingImages(ctx.pdfImages)) {
    const missing = getBrandingMissingSlots(urls, ctx.pdfImages ?? {
      headerBase64: null,
      footerBase64: null,
      watermarkBase64: null,
    });
    ctx.toast?.({
      variant: 'destructive',
      title: 'Identidade visual indisponível',
      description:
        missing.length > 0
          ? `Não foi possível carregar: ${missing.join(', ')}. Verifique ${BRANDING_SETUP_PATH}, recarregue a página (F5) e tente de novo.`
          : BRANDING_REQUIRED_MESSAGE,
    });
    return false;
  }

  return true;
}

export function brandingUrlsComplete(
  urls: BrandingImageUrls | null | undefined,
): boolean {
  return hasCompleteBrandingUrls(urls);
}
