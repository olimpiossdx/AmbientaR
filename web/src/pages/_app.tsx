import type { AppProps } from "next/app";

/**
 * Necessário para o Pages Router reconhecer `pages/_error.tsx` e `pages/_document.tsx`.
 * O app principal vive em `src/app/`; estes ficheiros só servem de fallback
 * quando o Next (dev) precisa de `/_error` — evita "missing required error components".
 */
export default function PagesApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
