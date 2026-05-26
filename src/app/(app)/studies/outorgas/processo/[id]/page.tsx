"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { OutorgaProcessoWizard } from "@/components/outorgas/outorga-processo-wizard";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { OutorgaProcesso } from "@/lib/types";

function OutorgaProcessoPageContent() {
  const params = useParams();
  const id = (params?.id as string | undefined) ?? "";
  const router = useRouter();
  const { firestore } = useFirebase();

  const processoRef = useMemoFirebase(
    () =>
      firestore && id ? doc(firestore, "outorga_processos", id) : null,
    [firestore, id],
  );
  const { data: processo, isLoading } = useDoc<OutorgaProcesso>(processoRef);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Processo de outorga" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Processo de outorga">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => router.push("/studies/outorgas")}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Processo não encontrado.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Processo de outorga">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => router.push("/studies/outorgas")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <OutorgaProcessoWizard processo={processo} />
        </div>
      </main>
    </div>
  );
}

export default function OutorgaProcessoPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-muted-foreground text-sm">Carregando…</div>
      }
    >
      <OutorgaProcessoPageContent />
    </Suspense>
  );
}
