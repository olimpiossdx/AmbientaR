import type { McpRagPermissionRow } from "@/lib/mcp-rag/types";

/** Matriz resumida — espelha regras atuais; pipeline futuro pode filtrar por tenant. */
export const MCP_RAG_PERMISSION_MATRIX: McpRagPermissionRow[] = [
  {
    role: "admin",
    canSearchJuridica: true,
    canSearchCloud: true,
    canManageHub: true,
  },
  {
    role: "gestor / supervisor / técnico",
    canSearchJuridica: true,
    canSearchCloud: true,
    canManageHub: false,
  },
  {
    role: "advogado",
    canSearchJuridica: true,
    canSearchCloud: true,
    canManageHub: false,
  },
  {
    role: "cliente / representante",
    canSearchJuridica: false,
    canSearchCloud: false,
    canManageHub: false,
  },
];
