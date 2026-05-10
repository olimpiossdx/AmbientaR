/**
 * Detecção best-effort do tipo de anexo pela URL (Firebase Storage costuma terminar em token query).
 */
export function isImageAttachmentUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif)(\?|#|$)/i.test(url);
}

export function isPdfAttachmentUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return /\.pdf(\?|#|$)/i.test(url) || /application\/pdf/i.test(url);
}
