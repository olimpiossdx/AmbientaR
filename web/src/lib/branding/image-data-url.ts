/** Deteção de MIME e data URLs para branding (browser + Node). */

export type BrandingImageMime = 'image/png' | 'image/jpeg';

export function detectImageMimeFromBytes(bytes: Uint8Array): BrandingImageMime {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8
  ) {
    return 'image/jpeg';
  }
  return 'image/png';
}

export function bufferToImageDataUrl(buf: Buffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array && !(buf instanceof Buffer)
    ? buf
    : new Uint8Array(buf);
  const mime = detectImageMimeFromBytes(bytes);
  const base64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(bytes).toString('base64')
      : btoa(String.fromCharCode(...bytes));
  return `data:${mime};base64,${base64}`;
}

/** Tipo aceite pelo `ImageRun` do pacote docx. */
export function docxImageTypeFromDataUrl(
  dataUrl: string,
): 'png' | 'jpg' | 'gif' | 'bmp' {
  const mime = dataUrl.match(/^data:([^;]+);/i)?.[1]?.toLowerCase() ?? '';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('bmp')) return 'bmp';
  return 'png';
}
