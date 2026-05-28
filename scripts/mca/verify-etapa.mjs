#!/usr/bin/env node
/**
 * Verifica etapa MCA (ex.: npm run mca:verify-etapa -- 03)
 * E01–E04, E05: offline. E06–E15: npm run mca:verify-all-etapas
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const etapa = Number(process.argv[2] ?? "3");
const root = process.cwd();
const registryPath = path.join(root, "infra/mca-engine/mca_agent_registry.yaml");

function parseAgents(raw) {
  const agents = {};
  const normalized = raw.replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n  ([A-Z][A-Za-z0-9_]+):\n/);
  for (let i = 1; i < blocks.length; i += 2) {
    const id = blocks[i];
    const body = blocks[i + 1] ?? "";
    const depends = [];
    const multi = body.match(/depends_on:\n((?:\s+-\s+.+\n?)+)/);
    if (multi?.[1]) {
      for (const line of multi[1].split("\n")) {
        const m = line.match(/-\s+(\S+)/);
        if (m) depends.push(m[1]);
      }
    } else {
      const one = body.match(/depends_on:\s*\[([\s\S]*?)\]/);
      if (one?.[1]?.trim()) {
        depends.push(
          ...one[1].split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")),
        );
      }
    }
    agents[id] = { depends_on: depends };
  }
  return agents;
}

function resolveOrder(agents, requested) {
  const all = new Set(requested ?? Object.keys(agents));
  for (const id of [...all]) {
    for (const dep of agents[id]?.depends_on ?? []) {
      if (agents[dep]) all.add(dep);
    }
  }
  const inDeg = new Map([...all].map((id) => [id, 0]));
  const graph = new Map([...all].map((id) => [id, []]));
  for (const id of all) {
    for (const dep of agents[id]?.depends_on ?? []) {
      if (!all.has(dep)) continue;
      graph.get(dep).push(id);
      inDeg.set(id, inDeg.get(id) + 1);
    }
  }
  const q = [...all].filter((id) => inDeg.get(id) === 0);
  const order = [];
  while (q.length) {
    const n = q.shift();
    order.push(n);
    for (const x of graph.get(n) ?? []) {
      inDeg.set(x, inDeg.get(x) - 1);
      if (inDeg.get(x) === 0) q.push(x);
    }
  }
  if (order.length !== all.size) throw new Error("DAG cycle");
  return order;
}

function runTsEtapa(n) {
  const script = path.join(root, "scripts/mca/verify-all-etapas.ts");
  const r = spawnSync("npx", ["tsx", script], { cwd: root, encoding: "utf8", shell: true });
  if (r.status !== 0) {
    console.error(r.stdout || r.stderr);
    process.exit(1);
  }
  const label = `E${String(n).padStart(2, "0")}`;
  const passFile = path.join(root, "docs/mca/debug-reports", `${label}-pass.md`);
  if (fs.existsSync(passFile)) {
    console.log(`${label} PASS (ver ${passFile})`);
  } else {
    console.log(`${label} PASS (verify-all-etapas)`);
  }
  process.exit(0);
}

if (etapa >= 6) {
  runTsEtapa(etapa);
}

if (etapa === 3) {
  const raw = fs.readFileSync(registryPath, "utf8");
  const agents = parseAgents(raw);
  const ids = Object.keys(agents);
  const order = resolveOrder(agents);
  console.log(`E03 PASS: ${ids.length} agentes, DAG ordem ${order.length}`);
  process.exit(0);
}

if (etapa === 1) {
  const spec = path.join(root, "docs/mca/REFERENCIA-PIMENTA.md");
  if (!fs.existsSync(spec)) {
    console.error("E01 FAIL: falta REFERENCIA-PIMENTA.md");
    process.exit(1);
  }
  console.log("E01 PASS: spec encontrada");
  process.exit(0);
}

if (etapa === 2) {
  const health = path.join(root, "src/app/api/mca/health/route.ts");
  const engine = path.join(root, "infra/mca-engine/main.py");
  if (!fs.existsSync(health) || !fs.existsSync(engine)) {
    console.error("E02 FAIL: falta health API ou mca-engine");
    process.exit(1);
  }
  console.log("E02 PASS: ficheiros infra presentes (corra curl /api/mca/health em dev)");
  process.exit(0);
}

if (etapa === 4) {
  const ui = path.join(root, "src/app/(app)/studies/mapas/mca-workbench.tsx");
  const api = path.join(root, "src/app/api/mca/projects/route.ts");
  if (!fs.existsSync(ui) || !fs.existsSync(api)) {
    console.error("E04 FAIL: falta UI ou API projects");
    process.exit(1);
  }
  console.log("E04 PASS: McaWorkbench + API projects");
  process.exit(0);
}

if (etapa === 5) {
  const goldIds = ["gold_palmeiras", "gold_mangabeiras", "gold_catingueiro"];
  let missing = 0;
  for (const id of goldIds) {
    const p = path.join(root, "public/mca/gold", id, "perimeter.geojson");
    if (!fs.existsSync(p)) {
      console.error(`E05 FAIL: falta ${p}`);
      missing++;
      continue;
    }
    try {
      const fc = JSON.parse(fs.readFileSync(p, "utf8"));
      if (!fc?.features?.length) {
        console.error(`E05 FAIL: ${id} sem features`);
        missing++;
      }
    } catch {
      console.error(`E05 FAIL: JSON inválido em ${id}`);
      missing++;
    }
  }
  if (missing) process.exit(1);
  console.log("E05 PASS: 3 perímetros ouro em public/mca/gold/*/perimeter.geojson");
  console.log("  (pipeline completo: npm run mca:verify-all-etapas)");
  process.exit(0);
}

console.log(`Etapa ${etapa}: npm run mca:verify-all-etapas`);
process.exit(0);
