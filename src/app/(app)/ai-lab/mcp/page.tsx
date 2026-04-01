"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/firebase";

export default function AiLabMcpPage() {
  const { user } = useAuth();

  if (user && user.role !== "admin") {
    return (
      <div className="flex flex-col h-full">
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
    <div className="flex flex-col h-full">
      <PageHeader title="MCP & Ferramentas" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Objetivo do módulo</CardTitle>
            <CardDescription>
              Padronizar uso de MCP para produtividade, auditoria e execução
              assistida com segurança.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>- Catálogo de ferramentas MCP disponíveis por equipe.</p>
            <p>- Playbooks de execução (deploy, validação, diagnóstico).</p>
            <p>- Regras de acesso por perfil e trilha de auditoria.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
