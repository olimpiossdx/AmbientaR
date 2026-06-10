"use client";

import { PageHeader } from "@/components/page-header";
import { OnedriveIntegrationPanel } from "@/components/mcp-rag/panels/onedrive-integration-panel";

export default function OnedriveIntegrationPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Integração OneDrive"
        description="Beta admin — catálogo leve no Firestore; ficheiros permanecem no OneDrive."
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <OnedriveIntegrationPanel />
      </main>
    </div>
  );
}
