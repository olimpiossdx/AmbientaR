/** Grafo de conhecimento estático (v2) — relações semânticas entre layers. */

export type McaKnowledgeRelation = {
  from: string;
  to: string;
  relation: "derives" | "buffers" | "conflicts" | "contains" | "labels";
};

export const MCA_KNOWLEDGE_RELATIONS: McaKnowledgeRelation[] = [
  { from: "HYD_CORREGO", to: "AMB_APP_BUFFER", relation: "buffers" },
  { from: "HYD_VEREDA", to: "AMB_APP_BUFFER", relation: "buffers" },
  { from: "AMB_APP_BUFFER", to: "AMB_APP", relation: "derives" },
  { from: "AMB_APP", to: "AMB_RL_GLEBA", relation: "contains" },
  { from: "USO_LAVOURA", to: "AMB_APP", relation: "conflicts" },
  { from: "USO_PIVO", to: "AMB_APP", relation: "conflicts" },
  { from: "FUND_LIMITE", to: "FUND_MATRICULA", relation: "contains" },
  { from: "FUND_LIMITE", to: "FUND_CONFRONTANTE", relation: "labels" },
  { from: "BASE_PERIMETRO", to: "FUND_LIMITE", relation: "derives" },
];

export function knowledgeDownstream(fromKey: string): string[] {
  const out = new Set<string>();
  const queue = [fromKey];
  while (queue.length) {
    const key = queue.shift()!;
    for (const rel of MCA_KNOWLEDGE_RELATIONS) {
      if (rel.from === key && !out.has(rel.to)) {
        out.add(rel.to);
        queue.push(rel.to);
      }
    }
  }
  return [...out];
}

export function knowledgeUpstream(toKey: string): string[] {
  return MCA_KNOWLEDGE_RELATIONS.filter((r) => r.to === toKey).map((r) => r.from);
}
