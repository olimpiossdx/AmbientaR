/**
 * Worker do pdf.js no browser.
 * Em produção (App Hosting) o worker em `/public/pdfjs` pode falhar; CDN é o caminho estável.
 */

'use client';

export async function loadPdfJsForBrowser() {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window === 'undefined') return pdfjs;

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const version = pdfjs.version;
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }

  return pdfjs;
}
