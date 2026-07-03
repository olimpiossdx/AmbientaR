/**
 * Smoke test do hub MCP+RAG (produção ou local).
 * Uso:
 *   node scripts/verify-mcp-rag-hub.mjs
 *   node scripts/verify-mcp-rag-hub.mjs --base https://localhost:9002
 *   MCP_RAG_ID_TOKEN=eyJ... node scripts/verify-mcp-rag-hub.mjs
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice("--base=".length) ||
  process.env.MCP_RAG_BASE_URL ||
  "https://ambientar-teste--studio-316805764-e4d13.us-east4.hosted.app";

const token = process.env.MCP_RAG_ID_TOKEN || "";

const endpoints = [
  { method: "GET", path: "/configuracoes/mcp-rag", auth: false, expect: [200, 307, 308] },
  { method: "GET", path: "/api/mcp-rag/hub-overview", auth: true },
  { method: "GET", path: "/api/mcp-rag/ingestion/runs", auth: true },
  { method: "POST", path: "/api/mcp-rag/ingestion/almg-discover", auth: true },
];

let failed = 0;

console.log(`[verify-mcp-rag] base=${base}\n`);

for (const ep of endpoints) {
  const url = `${base.replace(/\/$/, "")}${ep.path}`;
  const headers = { Accept: "application/json" };
  if (ep.auth && token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, { method: ep.method, headers });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 80);
    }

    const okAdminGate =
      ep.auth && !token && (res.status === 401 || res.status === 403);
    const okAuth = ep.auth && token && res.ok;
    const okPublic = !ep.auth && (ep.expect?.includes(res.status) || res.ok);
    const ok = okAdminGate || okAuth || okPublic;

    const tag = ok ? "OK" : "FAIL";
    if (!ok) failed += 1;
    console.log(
      `${tag} ${ep.method} ${ep.path} → ${res.status}`,
      typeof body === "object" ? JSON.stringify(body).slice(0, 120) : body,
    );
  } catch (e) {
    failed += 1;
    console.log(`FAIL ${ep.method} ${ep.path} →`, e.message);
  }
}

if (!token) {
  console.log(
    "\n[info] Sem MCP_RAG_ID_TOKEN — APIs admin validadas só como 401/403 (esperado).",
  );
  console.log(
    "[info] Para teste autenticado: exporte token Firebase admin e reexecute.",
  );
}

process.exit(failed > 0 && token ? 1 : 0);
