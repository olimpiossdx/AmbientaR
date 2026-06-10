"use client";

import { PageHeader } from "@/components/page-header";
import { AiLocalSourcePanel } from "@/components/mcp-rag/panels/ai-local-source-panel";
import { useAuth } from "@/firebase";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AiLocalSourceSettingsPage() {
  const { user } = useAuth();

  if (user && user.role !== "admin") {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Pasta Base IA (Local)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Este módulo está disponível apenas para administradores.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Pasta Base IA (Local)" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <AiLocalSourcePanel />
      </main>
    </div>
  );
}
