export const MCP_RAG_TAB_IDS = [
  "visao",
  "busca",
  "oficiais",
  "ingestoes",
  "fontes",
  "biblioteca",
  "onedrive",
  "laboratorio",
  "mcp",
  "custos",
  "logs",
  "legado",
] as const;

export type McpRagTabId = (typeof MCP_RAG_TAB_IDS)[number];

export const DEFAULT_MCP_RAG_TAB: McpRagTabId = "visao";

export const MCP_RAG_TAB_LABELS: Record<McpRagTabId, string> = {
  visao: "Visão geral",
  busca: "Teste de busca",
  oficiais: "Fontes oficiais",
  ingestoes: "Ingestões",
  fontes: "Base Jurídica",
  biblioteca: "Biblioteca OneDrive",
  onedrive: "OneDrive clientes",
  laboratorio: "Lab RAG",
  mcp: "MCP",
  custos: "Custos",
  logs: "Logs",
  legado: "Legado local",
};

export function isMcpRagTabId(value: string | null | undefined): value is McpRagTabId {
  if (!value) return false;
  return (MCP_RAG_TAB_IDS as readonly string[]).includes(value);
}

export function mcpRagTabQuery(tab: McpRagTabId): string {
  return `/configuracoes/mcp-rag?tab=${tab}`;
}
