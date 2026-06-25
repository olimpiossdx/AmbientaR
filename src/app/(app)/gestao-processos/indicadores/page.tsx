"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GestaoProcessosIndicadoresView } from "@/components/gestao-processos/gestao-processos-indicadores-view";

function IndicadoresLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function GestaoProcessosIndicadoresPage() {
  return (
    <Suspense fallback={<IndicadoresLoading />}>
      <GestaoProcessosIndicadoresView />
    </Suspense>
  );
}
