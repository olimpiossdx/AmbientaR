/**
 * PDF.js no browser via CDN — evita empacotar `pdfjs-dist/build/pdf.mjs` no Next/Turbopack
 * (o ficheiro usa `import()` dinâmico do worker, que o bundler não resolve).
 * Versão alinhada com `pdfjs-dist` em package.json.
 */

'use client';

/** Mantém em sync com `package.json` → pdfjs-dist */
const PDFJS_VERSION = '5.4.296';

const PDFJS_CDN_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`;

export type PdfJsBrowserModule = {
  version: string;
  getDocument: (params: { data: Uint8Array }) => {
    promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getViewport: (p: { scale: number }) => { width: number; height: number };
        render: (p: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
          canvas: HTMLCanvasElement;
        }) => { promise: Promise<void> };
      }>;
    }>;
  };
  GlobalWorkerOptions: { workerSrc: string };
};

let pdfjsPromise: Promise<PdfJsBrowserModule> | null = null;

export async function loadPdfJsForBrowser(): Promise<PdfJsBrowserModule> {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js só pode ser usado no navegador.');
  }
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = (await import(
        /* webpackIgnore: true */
        `${PDFJS_CDN_BASE}/build/pdf.min.mjs`
      )) as PdfJsBrowserModule;
      pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN_BASE}/build/pdf.worker.min.mjs`;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}
