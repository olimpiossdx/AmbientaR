"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RelatorioInventarioForm } from "../relatorio-form";
import { useFaunaStudyPageSave } from "../../_shared/use-fauna-study-page-save";

export default function EditInventarioRelatorioFaunaPage({
  params,
}: {
  params: { id: string };
}) {
  const handleSave = useFaunaStudyPageSave("inventario_relatorio");

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar Relatório de Inventário de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Relatório Técnico</CardTitle>
            <CardDescription>
              Atualize o relatório de inventário de fauna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RelatorioInventarioForm
              documentId={params.id}
              onSave={handleSave}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
