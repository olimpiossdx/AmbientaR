/**
 * Smoke HTTP das rotas do checklist PERF (requer dev em :9002).
 * Uso: npm run perf:smoke-http
 */
import http from "node:http";

const BASE = process.env.PERF_SMOKE_BASE || "http://127.0.0.1:9002";

const ROUTES = [
  { phase: "G1", path: "/login", expect: [200, 307] },
  { phase: "F07", path: "/crm", expect: [200, 307] },
  { phase: "F07", path: "/crm/reports", expect: [200, 307] },
  { phase: "F08", path: "/cash-flow", expect: [200, 307] },
  { phase: "F08", path: "/financial/fluxo-projetado", expect: [200, 307] },
  { phase: "F09", path: "/monitoring/manual", expect: [200, 307] },
  { phase: "F10", path: "/analise-ambiental", expect: [200, 307] },
  { phase: "F13", path: "/licenses", expect: [200, 307] },
  { phase: "F13", path: "/licenses/new", expect: [200, 307] },
  { phase: "F14", path: "/invoices", expect: [200, 307] },
  { phase: "F14", path: "/outorgas", expect: [200, 307] },
  { phase: "F15", path: "/technical-responsible", expect: [200, 307] },
  { phase: "F16", path: "/studies/rca", expect: [200, 307] },
  { phase: "G1", path: "/", expect: [200, 307] },
];

function fetchStatus(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 120_000 }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function main() {
  console.log(`\n=== PERF smoke HTTP — ${BASE} ===\n`);

  let ok = 0;
  let fail = 0;

  for (const { phase, path: route, expect } of ROUTES) {
    const url = `${BASE}${route}`;
    try {
      const status = await fetchStatus(url);
      if (expect.includes(status)) {
        console.log(`[${phase}] OK ${route} → ${status}`);
        ok++;
      } else {
        console.error(`[${phase}] FALHA ${route} → ${status} (esperado ${expect.join("|")})`);
        fail++;
      }
    } catch (e) {
      console.error(`[${phase}] FALHA ${route} → ${e.message}`);
      fail++;
    }
  }

  console.log(`\n--- HTTP smoke: ${ok}/${ok + fail} ---\n`);
  if (fail) process.exit(1);
}

main();
