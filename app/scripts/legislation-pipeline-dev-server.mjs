/**
 * Dev server local (porta 8092) — substituto do worker Python quando Docker não está disponível.
 * API compatível com infra/legislation-pipeline/main.py
 */
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.LEGISLATION_PIPELINE_PORT || 8092);
const SECRET =
  process.env.LEGISLATION_PIPELINE_SECRET ||
  process.env.WORKER_SHARED_SECRET ||
  "dev-legislation-secret";
const ALMG_BASE =
  process.env.ALMG_OPEN_DATA_BASE_URL?.trim() ||
  "https://dadosabertos.almg.gov.br";

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function probeAlmg() {
  const url = `${ALMG_BASE.replace(/\/$/, "")}/api/v2/pronunciamentos/tipos`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`ALMG HTTP ${res.status}`);
  const data = await res.json();
  return { endpoint: url, keys: Object.keys(data) };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, {
      status: "ok",
      service: "legislation-pipeline-dev-node",
      pgvector: false,
      almgBase: ALMG_BASE,
    });
  }

  if (req.method === "POST" && req.url === "/v1/ingest/run") {
    const auth = req.headers["x-worker-secret"];
    if (SECRET && auth !== SECRET) {
      return json(res, 401, { success: false, error: "Invalid worker secret" });
    }

    let body = {};
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    } catch {
      return json(res, 400, { success: false, error: "JSON inválido" });
    }

    const sourceId = body.sourceId || "almg-open-data";
    const mode = body.mode || "incremental";
    const runId = randomUUID();

    if (sourceId !== "almg-open-data") {
      return json(res, 400, {
        success: false,
        error: `sourceId ${sourceId} não implementado no stub dev`,
      });
    }

    try {
      const discovery = await probeAlmg();
      const documentsSeen = mode === "discover" ? 1 : 1;
      return json(res, 200, {
        success: true,
        runId,
        status: "completed",
        documentsSeen,
        chunksCreated: 0,
        message:
          mode === "discover"
            ? "Descoberta ALMG (stub Node dev)"
            : `Stub incremental: API OK (${discovery.keys.join(", ")}). pgvector pendente.`,
        discovery,
      });
    } catch (e) {
      return json(res, 500, {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `[legislation-pipeline-dev] http://localhost:${PORT} (secret=${SECRET ? "on" : "off"})`,
  );
});
