import type { McpToolDefinition } from "@/lib/mcp-rag/types";
import { isCloudRagEnabled } from "@/lib/cloud-rag/deploy-flags";

export function getMcpToolsRegistry(): McpToolDefinition[] {
  const cloudOk = isCloudRagEnabled();

  return [
    {
      id: "search_legislation",
      name: "search_legislation",
      description:
        "Busca legislação ambiental e normas técnicas em base RAG auditável.",
      status: cloudOk ? "available" : "planned",
      backend: "cloud_rag",
    },
    {
      id: "get_legal_document",
      name: "get_legal_document",
      description: "Recupera metadados e texto de um documento normativo indexado.",
      status: "planned",
      backend: "pipeline",
    },
    {
      id: "get_legal_chunk",
      name: "get_legal_chunk",
      description: "Recupera chunk jurídico com hierarquia (artigo, parágrafo, inciso).",
      status: "planned",
      backend: "pipeline",
    },
    {
      id: "explain_normative_context",
      name: "explain_normative_context",
      description: "Resume contexto normativo com citações obrigatórias.",
      status: "available",
      backend: "firestore_rag",
    },
    {
      id: "list_available_sources",
      name: "list_available_sources",
      description: "Lista fontes oficiais e internas disponíveis para busca.",
      status: "available",
      backend: "firestore_rag",
    },
    {
      id: "search_cloud_library",
      name: "search_cloud_library",
      description: "Pesquisa na biblioteca OneDrive indexada (cloud-rag).",
      status: cloudOk ? "available" : "disabled",
      backend: "cloud_rag",
    },
  ];
}
