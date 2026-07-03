/**
 * Indica se a URL provavelmente pode ser embutida em iframe a partir de outra origem.
 * Baseado em X-Frame-Options e CSP frame-ancestors (resposta HEAD).
 */
export function isUrlEmbeddableInIframe(
  xFrameOptions: string | null,
  contentSecurityPolicy: string | null
): boolean {
  if (xFrameOptions) {
    const value = xFrameOptions.toLowerCase().trim();
    if (value === "deny" || value === "sameorigin") {
      return false;
    }
  }

  if (contentSecurityPolicy) {
    const match = contentSecurityPolicy.match(/frame-ancestors\s+([^;]+)/i);
    if (match) {
      const ancestors = match[1].toLowerCase().trim();
      if (ancestors === "'none'" || ancestors === "none") {
        return false;
      }
    }
  }

  return true;
}
