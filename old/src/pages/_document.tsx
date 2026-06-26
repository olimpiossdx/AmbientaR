import { Html, Head, Main, NextScript } from "next/document";

/**
 * Documento base do Pages Router (só usado em rotas/fallbacks `pages/*`).
 * Ajuda o dev server a compilar o caminho de erro (`/_error`) sem falhas.
 */
export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
