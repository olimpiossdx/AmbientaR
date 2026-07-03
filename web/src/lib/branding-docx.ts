'use client';

/** Reexporta setup partilhado (browser + servidor via import dinâmico no Node). */
export {
  buildBrandedDocxSectionSetup,
  DOCX_BRANDING_CONTENT_WIDTH_MM,
  DOCX_BRANDING_FONT,
  mmToDocxPx,
  pngDataUrlToUint8Array,
  type BrandedDocxSectionSetup,
  type BuildBrandedDocxSectionOptions,
} from '@/lib/branding/branding-docx-setup';
