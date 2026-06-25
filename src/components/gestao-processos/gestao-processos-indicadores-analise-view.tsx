"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useOfficeTasksCollection } from "@/lib/gestao-processos/use-office-tasks-collection";
import {
  GESTAO_PROCESSOS_INDICADORES_ANALISE_LABEL,
} from "@/lib/gestao-processos-menu";
import { canAccessGestaoProcessosIndicadores } from "@/lib/gestao-processos/role-guards";
import { computeResolutionTimeOverview } from "@/lib/gestao-processos/resolution-time-metrics";
import type { ConsultoriaProject, OfficeProcess } from "@/lib/gestao-processos/types";
import { cn } from "@/lib/utils";

const ResolutionBarChart = dynamic(
  () =>
    import("@/components/gestao-processos/gestao-processos-indicadores-charts").then(
      (m) => m.ResolutionBarChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[360px] w-full" />,
  },
);

function SummaryCard({
  label,
  avgDays,
  sample,
}: {
  label: string;
  avgDays: number | null;
  sample: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-semibold tabular-nums">
          {avgDays !== null ? `${avgDays} dias` : "—"}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Amostra: {sample}</p>
      </CardContent>
    </Card>
  );
}

export function GestaoProcessosIndicadoresAnaliseView() {
  const { firestore, user } = useFirebase();
  const canAccess = canAccessGestaoProcessosIndicadores(user?.role);

  const { data: tasks, isLoading: loadingTasks } = useOfficeTasksCollection(
    Boolean(firestore && canAccess),
    user?.uid,
    true,
  );

  const processesQuery = useMemoFirebase(
    () => (firestore && canAccess ? collection(firestore, "officeProcesses") : null),
    [firestore, canAccess],
  );
  const { data: processes, isLoading: loadingProcesses } =
    useCollection<OfficeProcess>(processesQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore && canAccess ? collection(firestore, "consultoriaProjects") : null),
    [firestore, canAccess],
  );
  const { data: projects, isLoading: loadingProjects } =
    useCollection<ConsultoriaProject>(projectsQuery);

  const overview = React.useMemo(
    () => computeResolutionTimeOverview(tasks ?? [], processes ?? [], projects ?? []),
    [tasks, processes, projects],
  );

  const isLoading = loadingTasks || loadingProcesses || loadingProjects;

  if (!canAccess) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Acesso restrito ao administrador e ao gestor ambiental.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={GESTAO_PROCESSOS_INDICADORES_ANALISE_LABEL}
        description="Média de dias entre criação, protocolo (lançamento) e conclusão. Processos e projetos usam a data da última atualização como proxy de encerramento quando não há campo de conclusão."
      />

      <div className="space-y-6 p-4 md:p-6">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Tarefas — criação → conclusão"
              avgDays={overview.summary.tasksAvgDays}
              sample={overview.summary.tasksSample}
            />
            <SummaryCard
              label="Processos — criação → conclusão"
              avgDays={overview.summary.processesAvgDays}
              sample={overview.summary.processesSample}
            />
            <SummaryCard
              label="Projetos — criação → conclusão"
              avgDays={overview.summary.projectsAvgDays}
              sample={overview.summary.projectsSample}
            />
          </div>
        )}

        <Tabs defaultValue="tarefas" className="space-y-4">
          <TabsList className={cn("grid w-full max-w-lg grid-cols-3")}>
            <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
            <TabsTrigger value="processos">Processos</TabsTrigger>
            <TabsTrigger value="projetos">Projetos</TabsTrigger>
          </TabsList>

          <TabsContent value="tarefas" className="space-y-4">
            <ResolutionBarChart
              title="Tarefas concluídas — dias desde a criação até a conclusão"
              description="Agrupado por categoria da tarefa."
              buckets={overview.tasks.creationToCompletion}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="processos" className="space-y-4">
            <ResolutionBarChart
              title="Criação → protocolo (lançamento)"
              description="Dias entre abertura do processo na consultoria e data de protocolo no órgão. Por tipo de processo."
              buckets={overview.processes.creationToProtocol}
              isLoading={isLoading}
            />
            <ResolutionBarChart
              title="Protocolo → conclusão"
              description="Dias entre protocolo e encerramento (última atualização com fase concluída ou arquivada)."
              buckets={overview.processes.protocolToCompletion}
              isLoading={isLoading}
            />
            <ResolutionBarChart
              title="Criação → conclusão"
              description="Ciclo completo do processo na consultoria até o encerramento."
              buckets={overview.processes.creationToCompletion}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="projetos" className="space-y-4">
            <ResolutionBarChart
              title="Projetos concluídos — dias desde a criação até o encerramento"
              description="Agrupado por frente ambiental planejada (licença, outorga, DAIA, etc.)."
              buckets={overview.projects.creationToCompletion}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
