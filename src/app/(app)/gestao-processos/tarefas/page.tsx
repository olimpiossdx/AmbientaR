"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GestaoProcessosTarefasView } from "@/components/gestao-processos/gestao-processos-tarefas-view";

function TarefasLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function GestaoProcessosTarefasPage() {
  return (
    <Suspense fallback={<TarefasLoading />}>
      <GestaoProcessosTarefasView />
    </Suspense>
  );
}
