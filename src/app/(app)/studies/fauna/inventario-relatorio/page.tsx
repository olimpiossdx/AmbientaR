"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RelatorioInventarioForm } from "./relatorio-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { FaunaStudy } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useFaunaStudyPageSave } from "../_shared/use-fauna-study-page-save";
import { ProjetoVinculadoBanner } from "../_shared/projeto-vinculado-banner";

function InventarioRelatorioFaunaPageContent() {
  const searchParams = useSearchParams();
  const projetoId = searchParams.get("projetoId");
  const { firestore } = useFirebase();
  const handleSave = useFaunaStudyPageSave("inventario_relatorio");

  const projetoRef = useMemoFirebase(
    () =>
      firestore && projetoId
        ? doc(firestore, "faunaStudies", projetoId)
        : null,
    [firestore, projetoId],
  );
  const { data: seedStudy, isLoading } = useDoc<FaunaStudy>(projetoRef);

  const wrappedSave = async (
    data: Record<string, unknown> & { id?: string },
    status: "draft" | "completed",
  ) => {
    const base = seedStudy
      ? {
          empreendedorId: seedStudy.empreendedorId,
          consultoriaId: seedStudy.consultoriaId,
        }
      : {};
    await handleSave({ ...base, ...data }, status);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Relatório de Inventário de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Relatório Técnico</CardTitle>
            <CardDescription>
              Elabore o relatório de inventário de fauna silvestre terrestre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projetoId && isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <ProjetoVinculadoBanner study={seedStudy} />
                <RelatorioInventarioForm
                  documentId={null}
                  seedStudy={seedStudy ?? null}
                  onSave={wrappedSave}
                />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function InventarioRelatorioFaunaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
      }
    >
      <InventarioRelatorioFaunaPageContent />
    </Suspense>
  );
}
