"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import {
  canAccessGestaoProcessosFluxo,
} from "@/lib/gestao-processos/role-guards";
import { GESTAO_PROCESSOS_PROJETOS_PATH } from "@/lib/gestao-processos-menu";
import { Skeleton } from "@/components/ui/skeleton";

const FluxoLoading = () => (
  <div className="space-y-4 p-4 md:p-6">
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const GestaoProcessosFluxoView = dynamic(
  () =>
    import("@/components/gestao-processos/gestao-processos-fluxo-view").then(
      (m) => ({ default: m.GestaoProcessosFluxoView }),
    ),
  {
    loading: FluxoLoading,
    ssr: false,
  },
);

export function FluxoView() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  React.useEffect(() => {
    if (isUserLoading || !user) return;
    if (!canAccessGestaoProcessosFluxo(user.role)) {
      router.replace(GESTAO_PROCESSOS_PROJETOS_PATH);
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!canAccessGestaoProcessosFluxo(user.role)) {
    return null;
  }

  return <GestaoProcessosFluxoView />;
}
