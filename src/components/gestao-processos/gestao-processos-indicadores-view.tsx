"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useOfficeTasksCollection } from "@/lib/gestao-processos/use-office-tasks-collection";
import type { AppUser } from "@/lib/types";
import {
  GESTAO_PROCESSOS_INDICADORES_LABEL,
  gestaoProcessosDetailPath,
} from "@/lib/gestao-processos-menu";
import { canAccessGestaoProcessosIndicadores } from "@/lib/gestao-processos/role-guards";
import { computeGestaoProcessosOverview } from "@/lib/gestao-processos/gestao-processos-metrics";
import type { ConsultoriaProject, OfficeProcess } from "@/lib/gestao-processos/types";
import type { OfficeTask } from "@/lib/gestao-processos/task-types";
import { cn } from "@/lib/utils";

function MetricCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums",
            warn && typeof value === "number" && value > 0 && "text-red-600",
          )}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export function GestaoProcessosIndicadoresView() {
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

  const usersQuery = useMemoFirebase(
    () => (firestore && canAccess ? collection(firestore, "users") : null),
    [firestore, canAccess],
  );
  const { data: users, isLoading: loadingUsers } = useCollection<AppUser>(usersQuery);

  const usersByUid = React.useMemo(
    () => new Map(users?.map((u) => [u.uid, u]) ?? []),
    [users],
  );

  const overview = React.useMemo(
    () =>
      computeGestaoProcessosOverview(
        tasks ?? [],
        processes ?? [],
        projects ?? [],
        usersByUid,
      ),
    [tasks, processes, projects, usersByUid],
  );

  const isLoading = loadingTasks || loadingProcesses || loadingProjects || loadingUsers;

  if (!canAccess) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Acesso restrito ao administrador.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={GESTAO_PROCESSOS_INDICADORES_LABEL}
        description="Visão inicial de cumprimento de prazos em tarefas, processos e projetos — norte operacional da consultoria."
      />

      <div className="space-y-6 p-4 md:p-6">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Tarefas</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Ativas" value={overview.tasks.ativas} />
                <MetricCard
                  label="Atrasadas"
                  value={overview.tasks.atrasadas}
                  warn
                />
                <MetricCard label="Concluídas no prazo" value={overview.tasks.concluidasNoPrazo} />
                <MetricCard
                  label="Concluídas fora do prazo"
                  value={overview.tasks.concluidasForaPrazo}
                  warn
                />
                <MetricCard label="Organização pessoal" value={overview.tasks.pessoais} />
                <MetricCard label="Atribuídas pela gestão" value={overview.tasks.atribuidas} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Processos</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Em tramitação" value={overview.processes.emTramitacao} />
                <MetricCard
                  label="Prazos vencidos"
                  value={overview.processes.prazosVencidos}
                  warn
                />
                <MetricCard label="Prioridade alta" value={overview.processes.prioridadeAlta} />
                <MetricCard label="Concluídos / arquivados" value={overview.processes.concluidos} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Projetos</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Total de projetos" value={overview.projects.total} />
                <MetricCard
                  label="Com processos em atraso"
                  value={overview.projects.comProcessosAtrasados}
                  warn
                />
              </div>
            </section>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tarefas por responsável</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead className="text-right">Ativas</TableHead>
                      <TableHead className="text-right">Atrasadas</TableHead>
                      <TableHead className="text-right">Concluídas</TableHead>
                      <TableHead className="text-right">% no prazo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.taskRowsByAssignee.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Sem dados de responsáveis.
                        </TableCell>
                      </TableRow>
                    ) : (
                      overview.taskRowsByAssignee.map((row) => (
                        <TableRow key={row.uid}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-muted-foreground">{row.roleLabel}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.ativas}</TableCell>
                          <TableCell
                            className={cn(
                              "text-right tabular-nums",
                              row.atrasadas > 0 && "font-medium text-red-600",
                            )}
                          >
                            {row.atrasadas}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{row.concluidas}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.pctNoPrazo !== null ? `${row.pctNoPrazo}%` : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processos com prazo vencido</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Processo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Empreendedor</TableHead>
                      <TableHead>Prazo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.overdueProcesses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum processo com prazo vencido.
                        </TableCell>
                      </TableRow>
                    ) : (
                      overview.overdueProcesses.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Link
                              href={gestaoProcessosDetailPath(p.id)}
                              className="font-mono text-sm text-primary hover:underline"
                            >
                              {p.numeroProcesso}
                            </Link>
                          </TableCell>
                          <TableCell>{p.tipoProcesso}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.empreendedorName}
                          </TableCell>
                          <TableCell className="text-red-600">{p.prazo ?? "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
