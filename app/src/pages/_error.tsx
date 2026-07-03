import type { NextPageContext } from "next";

type ErrorPageProps = {
  statusCode?: number;
  err?: Error & { statusCode?: number };
};

/**
 * Fallback do motor Next quando o render de erro não encontra outra rota.
 * Projeto App Router sem `pages/` antes falhava em dev com
 * "missing required error components, refreshing...".
 * Mantém dependências mínimas (sem @/) para funcionar mesmo com build partido.
 */
function PagesRouterError({ statusCode, err }: ErrorPageProps) {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: "36rem",
        margin: "0 auto",
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Erro ao carregar
      </h1>
      <p style={{ color: "#555", fontSize: "0.9rem" }}>
        {statusCode
          ? `O servidor respondeu com o código ${statusCode}. Consulte o terminal do dev.`
          : "Ocorreu um erro. Consulte o terminal do dev e o console do navegador."}
      </p>
      {err?.message ? (
        <pre
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            fontSize: "0.75rem",
            overflow: "auto",
            background: "#f5f5f5",
            borderRadius: "6px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {err.message}
        </pre>
      ) : null}
    </div>
  );
}

PagesRouterError.getInitialProps = async ({
  res,
  err,
}: NextPageContext): Promise<ErrorPageProps> => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode, err: err ?? undefined };
};

export default PagesRouterError;
