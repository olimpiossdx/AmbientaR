"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { CloudLibraryPanel } from "@/components/mcp-rag/panels/cloud-library-panel";

export default function CloudLibraryPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Biblioteca IA (OneDrive)"
        description="Sync, indexação e pesquisa na nuvem — módulo separado do import local."
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Suspense fallback={null}>
          <CloudLibraryPanel />
        </Suspense>
      </main>
    </div>
  );
}
