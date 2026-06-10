"use client";

import { PageHeader } from "@/components/page-header";
import { KnowledgeSourcesPanel } from "@/components/mcp-rag/panels/knowledge-sources-panel";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function KnowledgeSourcesPage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Base Jurídica / Fontes de Conhecimento">
        <Button
          size="sm"
          className="gap-1"
          onClick={() => router.push("/knowledge-sources/new")}
        >
          <PlusCircle className="h-4 w-4" />
          Nova fonte (manual)
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <KnowledgeSourcesPanel />
      </main>
    </div>
  );
}
