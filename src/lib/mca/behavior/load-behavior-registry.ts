import fs from "node:fs";
import path from "node:path";

export type McaBehaviorDef = {
  tier?: string;
  semantic_role?: string;
  legal_role?: string;
  visual_role?: string;
  depends_on?: string[];
  invalidates?: string[];
  produces?: string;
  style_profile?: string;
  cacheable?: boolean;
};

export type McaBehaviorRegistry = Record<string, McaBehaviorDef>;

let cached: McaBehaviorRegistry | null = null;

function parseList(block: string, key: string): string[] {
  const lines = block.match(new RegExp(`${key}:\\n((?:\\s+-\\s+.+\n?)+)`, "m"));
  if (lines?.[1]) {
    return lines[1]
      .split("\n")
      .map((line) => line.match(/-\s+(\S+)/)?.[1])
      .filter(Boolean) as string[];
  }
  const inline = block.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`));
  if (inline?.[1]?.trim()) {
    return inline[1].split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function parseBehaviorYaml(raw: string): McaBehaviorRegistry {
  const out: McaBehaviorRegistry = {};
  const normalized = raw.replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n([A-Z][A-Za-z0-9_]+):\n/);
  for (let i = 1; i < blocks.length; i += 2) {
    const id = blocks[i];
    const body = blocks[i + 1] ?? "";
    out[id] = {
      tier: body.match(/tier:\s*(\S+)/)?.[1],
      semantic_role: body.match(/semantic_role:\s*(\S+)/)?.[1],
      legal_role: body.match(/legal_role:\s*(\S+)/)?.[1],
      visual_role: body.match(/visual_role:\s*(\S+)/)?.[1],
      produces: body.match(/produces:\s*(\S+)/)?.[1],
      style_profile: body.match(/style_profile:\s*(\S+)/)?.[1],
      cacheable: body.includes("cacheable: true"),
      depends_on: parseList(body, "depends_on"),
      invalidates: parseList(body, "invalidates"),
    };
  }
  return out;
}

export function loadBehaviorRegistry(): McaBehaviorRegistry {
  if (cached) return cached;
  const p = path.join(process.cwd(), "infra/mca-engine/behavior_registry.yaml");
  if (!fs.existsSync(p)) {
    cached = {};
    return cached;
  }
  cached = parseBehaviorYaml(fs.readFileSync(p, "utf8"));
  return cached;
}

export function invalidatesFromBehaviorRegistry(changedAgentOrLayer: string): string[] {
  const reg = loadBehaviorRegistry();
  const out = new Set<string>();
  for (const def of Object.values(reg)) {
    if (def.produces === changedAgentOrLayer) {
      for (const k of def.invalidates ?? []) out.add(k);
    }
  }
  const direct = reg[changedAgentOrLayer];
  if (direct?.invalidates) {
    for (const k of direct.invalidates) out.add(k);
  }
  return [...out];
}
