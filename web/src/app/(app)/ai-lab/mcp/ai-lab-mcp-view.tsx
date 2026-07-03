"use client";

import { PageHeader } from "@/components/page-header";
import { McpToolsPanel } from "@/components/mcp-rag/panels/mcp-tools-panel";
import { useAuth } from "@/firebase";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AiLabMcpView() {
  const { user } = useAuth();

  if (user && user.role !== "admin") {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="MCP & Ferramentas" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Este módulo está disponível apenas para administradores nesta
                fase.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="MCP & Ferramentas" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <McpToolsPanel />
      </main>
    </div>
  );
}
