/**
 * Stub para o bundle do servidor — pdf.js só corre no browser.
 * Evita que Next/Turbopack tente externalizar ou executar pdfjs-dist (ESM) no Node.
 */
module.exports = new Proxy(
  {},
  {
    get(_, prop) {
      throw new Error(
        `pdfjs-dist (${String(prop)}) não está disponível no servidor. Use loadPdfJsForBrowser() no cliente.`,
      );
    },
  },
);
