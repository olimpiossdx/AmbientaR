import type { McaRegistry } from "./types";

export function resolveAgentOrder(
  registry: McaRegistry,
  requestedIds?: string[],
): string[] {
  const allIds = requestedIds?.length
    ? new Set(requestedIds)
    : new Set(Object.keys(registry));

  for (const id of [...allIds]) {
    const def = registry[id];
    if (!def) continue;
    for (const dep of def.depends_on) {
      if (registry[dep]) allIds.add(dep);
    }
  }

  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();
  for (const id of allIds) {
    inDegree.set(id, 0);
    graph.set(id, []);
  }

  for (const id of allIds) {
    const def = registry[id];
    if (!def) continue;
    for (const dep of def.depends_on) {
      if (!allIds.has(dep)) continue;
      graph.get(dep)!.push(id);
      inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
    }
  }

  const queue = [...allIds].filter((id) => (inDegree.get(id) ?? 0) === 0);
  const order: string[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    for (const nxt of graph.get(node) ?? []) {
      const d = (inDegree.get(nxt) ?? 1) - 1;
      inDegree.set(nxt, d);
      if (d === 0) queue.push(nxt);
    }
  }

  if (order.length !== allIds.size) {
    const missing = [...allIds].filter((id) => !order.includes(id));
    throw new Error(`Ciclo ou dependência inválida no DAG MCA: ${missing.join(", ")}`);
  }
  return order;
}
