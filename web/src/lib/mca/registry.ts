import fs from "node:fs";
import path from "node:path";
import type { McaAgentDef, McaRegistry } from "./types";

let cached: McaRegistry | null = null;

/** Parse mínimo do registry YAML (sem dependência yaml). */
function parseRegistryYaml(raw: string): McaRegistry {
  const agents: McaRegistry = {};
  const normalized = raw.replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n  ([A-Z][A-Za-z0-9_]+):\n/);
  if (blocks.length < 2) return agents;

  for (let i = 1; i < blocks.length; i += 2) {
    const id = blocks[i];
    const body = blocks[i + 1] ?? "";
    const family = body.match(/family:\s*(\w+)/)?.[1] as McaAgentDef["family"];
    const mode = body.match(/mode:\s*(\w+)/)?.[1] as McaAgentDef["mode"];
    const etapa = Number(body.match(/etapa_min:\s*(\d+)/)?.[1] ?? 1);
    const produces = body.match(/produces:\s*(\S+)/)?.[1] ?? id;
    const depMatch = body.match(/depends_on:\s*\[([\s\S]*?)\]/);
    const depends_on: string[] = [];
    if (depMatch?.[1]) {
      const inner = depMatch[1].trim();
      if (inner) {
        depends_on.push(
          ...inner.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")),
        );
      }
    } else {
      const lines = body.match(/depends_on:\n((?:\s+-\s+.+\n?)+)/);
      if (lines?.[1]) {
        for (const line of lines[1].split("\n")) {
          const m = line.match(/-\s+(\S+)/);
          if (m) depends_on.push(m[1]);
        }
      }
    }
    if (family && mode) {
      agents[id] = { family, mode, etapa_min: etapa, depends_on, produces };
    }
  }
  return agents;
}

export function loadMcaRegistry(): McaRegistry {
  if (cached) return cached;
  const registryPath = path.join(
    process.cwd(),
    "infra/mca-engine/mca_agent_registry.yaml",
  );
  const raw = fs.readFileSync(registryPath, "utf8");
  cached = parseRegistryYaml(raw);
  return cached;
}

export function getAgentProducesMap(registry?: McaRegistry): Record<string, string> {
  const reg = registry ?? loadMcaRegistry();
  const out: Record<string, string> = {};
  for (const [id, def] of Object.entries(reg)) {
    out[id] = def.produces;
  }
  return out;
}

export function listAgentsForEtapa(
  maxEtapa: number,
  registry?: McaRegistry,
  minEtapa = 1,
): string[] {
  const reg = registry ?? loadMcaRegistry();
  return Object.entries(reg)
    .filter(([, def]) => def.etapa_min >= minEtapa && def.etapa_min <= maxEtapa)
    .map(([id]) => id);
}

export function getAgentDef(agentId: string): McaAgentDef | undefined {
  return loadMcaRegistry()[agentId];
}
