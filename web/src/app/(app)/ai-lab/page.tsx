import { redirect } from "next/navigation";

/** Hub legado — redireciona para o menu unificado em Configurações. */
export default function AiLabLegacyHubPage() {
  redirect("/configuracoes/mcp-rag");
}
