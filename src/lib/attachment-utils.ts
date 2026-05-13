/**
 * Detecção best-effort do tipo de anexo pela URL (Firebase Storage usa path codificado e query).
 */
export function isImageAttachmentUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  if (/^data:image\//i.test(url)) return true;
  try {
    const u = new URL(url);
    const haystack = decodeURIComponent(u.pathname + u.search);
    return /\.(jpg|jpeg|png|webp|gif)(\?|&|#|$)/i.test(haystack);
  } catch {
    return /\.(jpg|jpeg|png|webp|gif)(\?|#|$)/i.test(url);
  }
}

export function isPdfAttachmentUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  if (/application\/pdf/i.test(url)) return true;
  try {
    const u = new URL(url);
    const haystack = decodeURIComponent(u.href);
    return /\.pdf(\?|&|#|$)/i.test(haystack);
  } catch {
    return /\.pdf(\?|#|$)/i.test(url);
  }
}
