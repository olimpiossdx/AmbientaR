/**
 * Worker do pdf.js no browser.
 * Em dev local, `import.meta.url` no bundle costuma gerar URL inválida (worker 404).
 * Ficheiro servido de `public/pdfjs/` — ver `npm run copy:pdf-worker`.
 */

'use client';

export async function loadPdfJsForBrowser() {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window === 'undefined') return pdfjs;

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const version = pdfjs.version;
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
    /** Em dev, CDN evita 404 se public/pdfjs ainda não foi copiado. */
    if (process.env.NODE_ENV === 'development') {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    }
  }

  return pdfjs;
}
