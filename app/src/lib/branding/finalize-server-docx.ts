import { applyBrandingToDocxBuffer } from '@/lib/branding/branding-docx-merge';
import {
  BrandingImagesLoadError,
  BrandingNotConfiguredError,
  requireBrandingImagesForServer,
} from '@/lib/branding/branding-server';

export { BrandingNotConfiguredError, BrandingImagesLoadError };

/** Aplica identidade visual a um DOCX gerado no servidor (Docxtemplater, etc.). */
export async function finalizeOfficialDocxBuffer(docxBuffer: Buffer): Promise<Buffer> {
  const { images } = await requireBrandingImagesForServer();
  return applyBrandingToDocxBuffer(docxBuffer, images);
}

export function brandingApiErrorResponse(error: unknown): {
  status: number;
  body: { success: false; error: string };
} {
  if (error instanceof BrandingNotConfiguredError) {
    return { status: 503, body: { success: false, error: error.message } };
  }
  if (error instanceof BrandingImagesLoadError) {
    return { status: 503, body: { success: false, error: error.message } };
  }
  return {
    status: 500,
    body: {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao aplicar identidade visual.',
    },
  };
}
