/**
 * 404 do Pages Router — o Next avisa se existir `/_error` sem `/404`.
 * O tráfego normal da app usa `src/app/not-found.tsx`.
 */
export default function PagesRouter404() {
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
      <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Página não encontrada</h1>
      <p style={{ color: "#555", fontSize: "0.9rem", marginTop: "0.5rem" }}>
        Esta URL não corresponde a uma rota do Pages Router. Use a navegação da
        aplicação ou volte ao início.
      </p>
    </div>
  );
}
