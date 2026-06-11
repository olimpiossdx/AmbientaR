"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MtrDeclaracaoPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="MTR-Declaração"
        description="Declarações e manifestos de transporte de resíduos (MTR-MG / SEMAD-FEAM)."
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Documentos MTR</CardTitle>
              <CardDescription>
                Registro e acompanhamento de declarações MTR no módulo Documentos
                Ambientais.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              A integração com o WebService MTR-MG está disponível em Estudos
              Técnicos → MTR-MG (resíduos). Este módulo será expandido para
              listagem e gestão das declarações do cliente.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
