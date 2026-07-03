"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AiRoutingInfoCard } from "@/components/ai/ai-provider-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/firebase";
import { McpRagStatusOverview } from "@/components/mcp-rag/mcp-rag-status-overview";
import { McpRagSearchTester } from "@/components/mcp-rag/mcp-rag-search-tester";
import {
  DEFAULT_MCP_RAG_TAB,
  isMcpRagTabId,
  MCP_RAG_TAB_IDS,
  MCP_RAG_TAB_LABELS,
  type McpRagTabId,
} from "@/components/mcp-rag/mcp-rag-tabs";
import { McpToolsPanel } from "@/components/mcp-rag/panels/mcp-tools-panel";
import { AiLocalSourcePanel } from "@/components/mcp-rag/panels/ai-local-source-panel";
import { OfficialSourcesPanel } from "@/components/mcp-rag/panels/official-sources-panel";
import { IngestionPanel } from "@/components/mcp-rag/panels/ingestion-panel";
import { CostsPanel } from "@/components/mcp-rag/panels/costs-panel";
import { LogsPanel } from "@/components/mcp-rag/panels/logs-panel";

const KnowledgeSourcesPanel = dynamic(
  () =>
    import("@/components/mcp-rag/panels/knowledge-sources-panel").then((m) => ({
      default: m.KnowledgeSourcesPanel,
    })),
  { loading: () => <PanelSkeleton /> },
);

const CloudLibraryPanel = dynamic(
  () =>
    import("@/components/mcp-rag/panels/cloud-library-panel").then((m) => ({
      default: m.CloudLibraryPanel,
    })),
  { loading: () => <PanelSkeleton /> },
);

const OnedriveIntegrationPanel = dynamic(
  () =>
    import("@/components/mcp-rag/panels/onedrive-integration-panel").then(
      (m) => ({
        default: m.OnedriveIntegrationPanel,
      }),
    ),
  { loading: () => <PanelSkeleton /> },
);

const RagLabPanel = dynamic(
  () =>
    import("@/components/mcp-rag/panels/rag-lab-panel").then((m) => ({
      default: m.RagLabPanel,
    })),
  { loading: () => <PanelSkeleton /> },
);

const FULL_PAGE_LINKS: Partial<Record<McpRagTabId, string>> = {
  fontes: "/knowledge-sources",
  biblioteca: "/ai-lab/cloud-library",
  onedrive: "/settings/onedrive-integration",
  laboratorio: "/ai-lab/rag",
  mcp: "/ai-lab/mcp",
  legado: "/settings/ai-local-source",
};

function PanelSkeleton() {
  return <Skeleton className="h-[28rem] w-full rounded-lg" />;
}

function TabPanelFrame({
  tab,
  children,
}: {
  tab: McpRagTabId;
  children: React.ReactNode;
}) {
  const fullHref = FULL_PAGE_LINKS[tab];
  return (
    <div className="space-y-3">
      {fullHref ? (
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href={fullHref}>
              Tela cheia
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ) : null}
      {children}
    </div>
  );
}

function McpRagHubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams?.get("tab") ?? null;
  const activeTab = isMcpRagTabId(rawTab) ? rawTab : DEFAULT_MCP_RAG_TAB;
  const [mountedTab, setMountedTab] = React.useState<McpRagTabId>(activeTab);

  React.useEffect(() => {
    setMountedTab(activeTab);
  }, [activeTab]);

  const onTabChange = (value: string) => {
    if (!isMcpRagTabId(value)) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", value);
    router.replace(`/configuracoes/mcp-rag?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        {MCP_RAG_TAB_IDS.map((id) => (
          <TabsTrigger key={id} value={id} className="text-xs sm:text-sm">
            {MCP_RAG_TAB_LABELS[id]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="visao" className="mt-4 space-y-4">
        <AiRoutingInfoCard />
        <McpRagStatusOverview />
      </TabsContent>

      <TabsContent value="busca" className="mt-4">
        <McpRagSearchTester />
      </TabsContent>

      <TabsContent value="oficiais" className="mt-4">
        {mountedTab === "oficiais" ? <OfficialSourcesPanel /> : null}
      </TabsContent>

      <TabsContent value="ingestoes" className="mt-4">
        {mountedTab === "ingestoes" ? <IngestionPanel /> : null}
      </TabsContent>

      <TabsContent value="fontes" className="mt-4">
        {mountedTab === "fontes" ? (
          <TabPanelFrame tab="fontes">
            <KnowledgeSourcesPanel />
          </TabPanelFrame>
        ) : null}
      </TabsContent>

      <TabsContent value="biblioteca" className="mt-4">
        {mountedTab === "biblioteca" ? (
          <TabPanelFrame tab="biblioteca">
            <Suspense fallback={<PanelSkeleton />}>
              <CloudLibraryPanel
                oauthReturnPath="/configuracoes/mcp-rag?tab=biblioteca"
                hideSearch
              />
            </Suspense>
          </TabPanelFrame>
        ) : null}
      </TabsContent>

      <TabsContent value="onedrive" className="mt-4">
        {mountedTab === "onedrive" ? (
          <TabPanelFrame tab="onedrive">
            <OnedriveIntegrationPanel />
          </TabPanelFrame>
        ) : null}
      </TabsContent>

      <TabsContent value="laboratorio" className="mt-4">
        {mountedTab === "laboratorio" ? (
          <TabPanelFrame tab="laboratorio">
            <RagLabPanel />
          </TabPanelFrame>
        ) : null}
      </TabsContent>

      <TabsContent value="mcp" className="mt-4">
        <TabPanelFrame tab="mcp">
          <McpToolsPanel />
        </TabPanelFrame>
      </TabsContent>

      <TabsContent value="custos" className="mt-4">
        {mountedTab === "custos" ? <CostsPanel /> : null}
      </TabsContent>

      <TabsContent value="logs" className="mt-4">
        {mountedTab === "logs" ? <LogsPanel /> : null}
      </TabsContent>

      <TabsContent value="legado" className="mt-4">
        <TabPanelFrame tab="legado">
          <AiLocalSourcePanel />
        </TabPanelFrame>
      </TabsContent>
    </Tabs>
  );
}

export function McpRagHub() {
  const { user } = useAuth();

  if (user && user.role !== "admin") {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="MCP + RAG / Inteligência do Sistema" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <p className="text-sm text-muted-foreground">
            Esta área administrativa está disponível apenas para administradores.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="MCP + RAG / Inteligência do Sistema"
        description="Configure, monitore e teste a inteligência documental do AmbientaR."
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Suspense fallback={<PanelSkeleton />}>
          <McpRagHubInner />
        </Suspense>
      </main>
    </div>
  );
}
