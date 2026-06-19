"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { GestaoProcessosFluxoView } from "@/components/gestao-processos/gestao-processos-fluxo-view";
import {
  canAccessGestaoProcessosFluxo,
} from "@/lib/gestao-processos/role-guards";
import { GESTAO_PROCESSOS_PROJETOS_PATH } from "@/lib/gestao-processos-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function GestaoProcessosFluxoPage() {
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
