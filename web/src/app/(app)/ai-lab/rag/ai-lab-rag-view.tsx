"use client";

import { PageHeader } from "@/components/page-header";
import { RagLabPanel } from "@/components/mcp-rag/panels/rag-lab-panel";

export function AiLabRagView() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Base de Conhecimento (RAG)" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <RagLabPanel />
      </main>
    </div>
  );
}
