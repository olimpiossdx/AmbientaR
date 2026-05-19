"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RelatorioMonitoramentoForm } from "../relatorio-form";
import { useFaunaStudyPageSave } from "../../_shared/use-fauna-study-page-save";

export default function EditMonitoramentoRelatorioFaunaPage({
  params,
}: {
  params: { id: string };
}) {
  const handleSave = useFaunaStudyPageSave("monitoramento_relatorio");

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar Relatório de Monitoramento de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Relatório Técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <RelatorioMonitoramentoForm
              documentId={params.id}
              onSave={handleSave}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
