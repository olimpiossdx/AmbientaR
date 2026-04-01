"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, DatabaseZap, Workflow } from "lucide-react";
import { useAuth } from "@/firebase";

export default function AiLabPage() {
  const { user } = useAuth();

  if (user && user.role !== "admin") {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Hub IA + MCP + RAG" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Este ambiente de validação inicial está disponível apenas para
                administradores.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  const backlogItems = [
    {
      id: "AI-001",
      nome: "Resumo inteligente de anexos financeiros",
      modulo: "Financeiro",
      status: "Planejado",
      prioridade: "Alta",
    },
    {
      id: "AI-002",
      nome: "Checklist de pendências de licenças/outorgas",
      modulo: "Autorizações/Relatórios",
      status: "Em piloto",
      prioridade: "Alta",
    },
    {
      id: "AI-003",
      nome: "Alertas de risco no funil comercial",
      modulo: "CRM",
      status: "Planejado",
      prioridade: "Média",
    },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Hub IA + MCP + RAG" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ambiente central de inovação</CardTitle>
            <CardDescription>
              Este espaço concentra os pilotos de IA antes de distribuir para os
              demais menus da aplicação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Estratégia inicial: validar fluxos, custo, segurança e usabilidade
              neste hub. Depois, pulverizar as capacidades aprovadas para
              Financeiro, Autorizações/Relatórios, Cadastro e CRM.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuração por ambiente (inicial)</CardTitle>
            <CardDescription>
              Recomendação para validar com segurança antes de disponibilizar
              para outros perfis.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              - DEV: modelos e prompts em experimento, logs completos e custos
              monitorados.
            </p>
            <p>
              - HML: prompts versionados, fallback definido e testes de
              regressão de resposta.
            </p>
            <p>
              - PRD: somente fluxos aprovados, guardrails ativos e trilha de
              auditoria obrigatória.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backlog priorizado</CardTitle>
            <CardDescription>
              Lista central para validar impacto antes da pulverização para os
              menus de negócio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {backlogItems.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {item.id} - {item.nome}
                </p>
                <p className="text-muted-foreground">
                  Módulo: {item.modulo} | Status: {item.status} | Prioridade:{" "}
                  {item.prioridade}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Workflow className="h-4 w-4" /> MCP & Ferramentas
              </CardTitle>
              <CardDescription>
                Conectores, comandos assistidos e produtividade do time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/ai-lab/mcp">Abrir módulo</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DatabaseZap className="h-4 w-4" /> Base RAG
              </CardTitle>
              <CardDescription>
                Catálogo de fontes, versionamento e governança de conhecimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/ai-lab/rag">Abrir módulo</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4" /> Automações IA
              </CardTitle>
              <CardDescription>
                Fluxos de negócio priorizados para execução incremental.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/ai-lab/automations">Abrir módulo</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
