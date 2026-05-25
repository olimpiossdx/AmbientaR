import { adminDb, adminStorage } from '@/lib/firebase-admin';
import type { BrandingImageUrls, BrandingPdfImages } from '@/lib/branding-pdf';
import { storagePathFromDownloadUrl } from '@/lib/storage-upload';
import {
  BRANDING_REQUIRED_MESSAGE,
  hasCompleteBrandingImages,
  hasCompleteBrandingUrls,
} from '@/lib/branding/requirements';

export type CompanyBrandingSettings = {
  headerImageUrl: string | null;
  footerImageUrl: string | null;
  watermarkImageUrl: string | null;
};

export class BrandingNotConfiguredError extends Error {
  constructor(message = BRANDING_REQUIRED_MESSAGE) {
    super(message);
    this.name = 'BrandingNotConfiguredError';
  }
}

export class BrandingImagesLoadError extends Error {
  constructor(
    public readonly missing: string[],
    message?: string,
  ) {
    super(
      message ??
        `Não foi possível carregar a identidade visual: ${missing.join(', ')}.`,
    );
    this.name = 'BrandingImagesLoadError';
  }
}

export async function fetchCompanyBrandingSettings(): Promise<CompanyBrandingSettings> {
  const snap = await adminDb().collection('companySettings').doc('branding').get();
  const data = snap.data() ?? {};
  return {
    headerImageUrl: (data.headerImageUrl as string | null) ?? null,
    footerImageUrl: (data.footerImageUrl as string | null) ?? null,
    watermarkImageUrl: (data.watermarkImageUrl as string | null) ?? null,
  };
}

async function downloadStorageObjectToBuffer(objectPath: string): Promise<Buffer> {
  const bucket = adminStorage().bucket();
  const [buf] = await bucket.file(objectPath).download();
  return buf;
}

async function downloadBrandingUrl(url: string): Promise<Buffer> {
  const trimmed = url.trim();
  const path = storagePathFromDownloadUrl(trimmed);
  if (path) {
    return downloadStorageObjectToBuffer(path);
  }
  const res = await fetch(trimmed);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao baixar imagem de branding`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function bufferToPngDataUrl(buf: Buffer): string {
  return `data:image/png;base64,${buf.toString('base64')}`;
}

/** Carrega imagens de branding no servidor (APIs DOCX/PDF). */
export async function fetchBrandingImagesForServer(
  urls: BrandingImageUrls,
): Promise<BrandingPdfImages> {
  const [headerBuf, footerBuf, watermarkBuf] = await Promise.all([
    urls.headerImageUrl?.trim()
      ? downloadBrandingUrl(urls.headerImageUrl).catch(() => null)
      : null,
    urls.footerImageUrl?.trim()
      ? downloadBrandingUrl(urls.footerImageUrl).catch(() => null)
      : null,
    urls.watermarkImageUrl?.trim()
      ? downloadBrandingUrl(urls.watermarkImageUrl).catch(() => null)
      : null,
  ]);

  return {
    headerBase64: headerBuf ? bufferToPngDataUrl(headerBuf) : null,
    footerBase64: footerBuf ? bufferToPngDataUrl(footerBuf) : null,
    watermarkBase64: watermarkBuf ? bufferToPngDataUrl(watermarkBuf) : null,
  };
}

/** Branding completo obrigatório para exportação oficial no servidor. */
export async function requireBrandingImagesForServer(): Promise<{
  urls: BrandingImageUrls;
  images: BrandingPdfImages;
}> {
  const settings = await fetchCompanyBrandingSettings();
  const urls: BrandingImageUrls = {
    headerImageUrl: settings.headerImageUrl,
    footerImageUrl: settings.footerImageUrl,
    watermarkImageUrl: settings.watermarkImageUrl,
  };

  if (!hasCompleteBrandingUrls(urls)) {
    throw new BrandingNotConfiguredError();
  }

  const images = await fetchBrandingImagesForServer(urls);
  const missing: string[] = [];
  if (!images.headerBase64) missing.push('cabeçalho');
  if (!images.footerBase64) missing.push('rodapé');
  if (!images.watermarkBase64) missing.push('marca d\'água');

  if (!hasCompleteBrandingImages(images)) {
    throw new BrandingImagesLoadError(missing);
  }

  return { urls, images };
}
