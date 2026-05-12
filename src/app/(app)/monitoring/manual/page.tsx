"use client";
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import { AlertTriangle, CheckCircle2, FileText, Pencil, Trash2 } from "lucide-react";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  errorEmitter,
  useAuth,
} from "@/firebase";
import {
  collection,
  doc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { ManualMonitoringLog, WaterPermit, AppUser, Empreendedor, Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { FirestorePermissionError } from "@/firebase/errors";
import { MonitoringForm } from "./monitoring-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateWaterCompliance, mapManualLogToTelemetryReading } from "@/lib/water-compliance-engine";
import { generateWaterCompliancePDF } from "@/lib/export-water-report";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { isClientePortalRole } from "@/lib/role-guards";

const canPerformWriteActions = (user: AppUser | null): boolean => {
  if (!user) return false;
  return user.role === "admin" || user.role === "gestor" || user.role === "cliente_autonomo";
};

export default function ManualMonitoringPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ManualMonitoringLog | null>(
    null,
  );
  const [selectedOutorga, setSelectedOutorga] = useState<string>("");
  const [selectedPonto, setSelectedPonto] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState<string>("ano_todo");
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<
    string[] | undefined
  >(undefined);

  const firestore = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore || !user) return;
    if (isClientePortalRole(user.role)) {
      setEmpreendedorIdsForUser(undefined);
      const userDocuments = [
        user.cpf || user.userCpf,
        ...(user.cnpjs || []),
      ].filter(Boolean) as string[];
      if (userDocuments.length > 0) {
        const q = query(
          collection(firestore, "empreendedores"),
          where("cpfCnpj", "in", userDocuments),
        );
        getDocs(q)
          .then((snap) => {
            const ids = snap.docs.map((d) => d.id);
            setEmpreendedorIdsForUser(ids.length > 0 ? ids : ["__none__"]);
          })
          .catch(() => setEmpreendedorIdsForUser(["__none__"]));
      } else {
        setEmpreendedorIdsForUser(["__none__"]);
      }
      return;
    }
    if (user.role === "representative") {
      setEmpreendedorIdsForUser(undefined);
      const repUid = user.id ?? (user as any).uid;
      const empreendedoresRef = collection(firestore, "empreendedores");
      const accessRequestsRef = collection(firestore, "access_requests");
      const qEmp = query(
        empreendedoresRef,
        where("approvedUserIds", "array-contains", repUid),
      );
      getDocs(qEmp)
        .then((snapshot) => {
          let ids = snapshot.docs.map((d) => d.id);
          if (ids.length > 0) {
            setEmpreendedorIdsForUser(ids);
            return;
          }
          const qApproved = query(
            accessRequestsRef,
            where("status", "==", "approved"),
            where("requestedByUserId", "==", repUid),
          );
          getDocs(qApproved)
            .then((snapReq) => {
              if (snapReq.docs.length === 0) {
                setEmpreendedorIdsForUser(["__none__"]);
                return;
              }
              const cpfs = new Set<string>();
              snapReq.docs.forEach((d) => {
                const cpf = (d.data().cpfOfInterested || "").trim();
                const digits = cpf.replace(/\D/g, "");
                if (digits.length >= 11) {
                  cpfs.add(cpf);
                  cpfs.add(digits);
                }
              });
              const cpfList = Array.from(cpfs).slice(0, 10);
              if (cpfList.length === 0) {
                setEmpreendedorIdsForUser(["__none__"]);
                return;
              }
              const qByCpf = query(
                empreendedoresRef,
                where("cpfCnpj", "in", cpfList),
              );
              getDocs(qByCpf)
                .then((snapEmp) => {
                  ids = snapEmp.docs.map((d) => d.id);
                  setEmpreendedorIdsForUser(
                    ids.length > 0 ? ids : ["__none__"],
                  );
                })
                .catch(() => setEmpreendedorIdsForUser(["__none__"]));
            })
            .catch(() => setEmpreendedorIdsForUser(["__none__"]));
        })
        .catch(() => setEmpreendedorIdsForUser(["__none__"]));
      return;
    }
    setEmpreendedorIdsForUser([]);
  }, [firestore, user]);

  const outorgasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (isClientePortalRole(user.role) || user.role === "representative") {
      if (empreendedorIdsForUser === undefined) return null;
      if (
        empreendedorIdsForUser.length === 0 ||
        empreendedorIdsForUser[0] === "__none__"
      ) {
        return query(
          collection(firestore, "outorgas"),
          where("empreendedorId", "==", "__none__"),
        );
      }
      return query(
        collection(firestore, "outorgas"),
        where("empreendedorId", "in", empreendedorIdsForUser.slice(0, 10)),
      );
    }
    return collection(firestore, "outorgas");
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: outorgas, isLoading: isLoadingOutorgas } =
    useCollection<WaterPermit>(outorgasQuery);
  const outorgasManuais = useMemo(
    () =>
      (outorgas || []).filter(
        (o) => !o.monitoringType || o.monitoringType === "manual",
      ),
    [outorgas],
  );
  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );
  const { data: projects } = useCollection<Project>(projectsQuery);
  const outorga = useMemo(
    () => outorgasManuais.find((o) => o.id === selectedOutorga),
    [outorgasManuais, selectedOutorga],
  );

  const isLoadingOutorgasList =
    isLoadingOutorgas ||
    ((isClientePortalRole(user?.role) || user?.role === "representative") &&
      empreendedorIdsForUser === undefined);

  useEffect(() => {
    if (!selectedOutorga) return;
    const stillExists = outorgasManuais.some((o) => o.id === selectedOutorga);
    if (!stillExists) {
      setSelectedOutorga("");
      setSelectedPonto("");
    }
  }, [outorgasManuais, selectedOutorga]);

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !selectedPonto) return null;
    return collection(firestore, "manualMonitoringLogs"); // Simple query for now
  }, [firestore, user, selectedPonto]);

  const { data: logs, isLoading: isLoadingLogs } =
    useCollection<ManualMonitoringLog>(logsQuery);

  const filteredLogs = useMemo(() => {
    return (
      logs?.filter(
        (log) =>
          log.pontoId === selectedPonto && log.outorgaId === selectedOutorga,
      ) || []
    );
  }, [logs, selectedPonto, selectedOutorga]);

  const telemetryFromManualLogs = useMemo(
    () => filteredLogs.map((log) => mapManualLogToTelemetryReading(log)),
    [filteredLogs],
  );

  const reportReadings = useMemo(() => {
    const selectedYear = Number(yearFilter);
    const selectedMonth = monthFilter === "ano_todo" ? null : Number(monthFilter);
    return telemetryFromManualLogs.filter((r) => {
      const d = new Date(r.timestamp);
      if (Number.isNaN(d.getTime())) return false;
      if (Number.isFinite(selectedYear) && d.getFullYear() !== selectedYear) return false;
      if (selectedMonth != null && d.getMonth() !== selectedMonth) return false;
      return true;
    });
  }, [telemetryFromManualLogs, yearFilter, monthFilter]);

  const yearlyReadings = useMemo(() => {
    const y = Number(yearFilter);
    if (!Number.isFinite(y)) return telemetryFromManualLogs;
    return telemetryFromManualLogs.filter((r) => {
      const d = new Date(r.timestamp);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === y;
    });
  }, [telemetryFromManualLogs, yearFilter]);

  const monthlyDashboardData = useMemo(() => {
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const rows = months.map((m) => ({
      month: m,
      volume: 0,
      hours: 0,
      days: 0,
    }));
    const activeDaysByMonth = new Map<number, Set<string>>();
    yearlyReadings.forEach((r) => {
      const d = new Date(r.timestamp);
      const month = d.getMonth();
      rows[month].volume += r.volumeM3 || 0;
      rows[month].hours += r.hoursActive || 0;
      const dayKey = d.toISOString().slice(0, 10);
      if (!activeDaysByMonth.has(month)) activeDaysByMonth.set(month, new Set());
      activeDaysByMonth.get(month)!.add(dayKey);
    });
    rows.forEach((row, idx) => {
      row.days = activeDaysByMonth.get(idx)?.size || 0;
      row.volume = Number(row.volume.toFixed(2));
      row.hours = Number(row.hours.toFixed(2));
    });
    return rows;
  }, [yearlyReadings]);

  const dashboardTotals = useMemo(() => {
    const totalVolume = monthlyDashboardData.reduce((acc, row) => acc + row.volume, 0);
    const totalHours = monthlyDashboardData.reduce((acc, row) => acc + row.hours, 0);
    const activeDays = monthlyDashboardData.reduce((acc, row) => acc + row.days, 0);
    return {
      totalVolume: Number(totalVolume.toFixed(2)),
      totalHours: Number(totalHours.toFixed(2)),
      activeDays,
    };
  }, [monthlyDashboardData]);

  const compliance = useMemo(() => {
    if (!outorga) return null;
    const selectedYear = Number(yearFilter);
    const referenceDate =
      monthFilter === "ano_todo"
        ? new Date(`${selectedYear}-01-01`)
        : new Date(selectedYear, Number(monthFilter), 1);
    return calculateWaterCompliance(reportReadings, outorga, referenceDate);
  }, [reportReadings, outorga, yearFilter, monthFilter]);

  const handleAddNew = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ManualMonitoringLog) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "manualMonitoringLogs", itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Lançamento deletado",
          description: "O registro foi removido com sucesso.",
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

  const empreendedorName = useMemo(() => {
    if (!outorga || !empreendedores) return "N/A";
    return empreendedores.find((e) => e.id === outorga.empreendedorId)?.name || "N/A";
  }, [outorga, empreendedores]);

  const empreendimentoName = useMemo(() => {
    if (!outorga?.projectId || !projects) return "N/A";
    return projects.find((p) => p.id === outorga.projectId)?.propertyName || "N/A";
  }, [outorga, projects]);

  const empreendimentoCoordinates = useMemo(() => {
    if (!outorga) return "N/A";
    const project = projects?.find((p) => p.id === outorga.projectId);
    if (project?.geographicLocation?.latLong) {
      const lat = project.geographicLocation.latLong.lat;
      const long = project.geographicLocation.latLong.long;
      const latText = [lat?.grau, lat?.min, lat?.seg].filter(Boolean).join(" ");
      const longText = [long?.grau, long?.min, long?.seg].filter(Boolean).join(" ");
      if (latText || longText) return `${latText} / ${longText}`.trim();
    }
    if (project?.geographicLocation?.utm) {
      const utm = project.geographicLocation.utm;
      return `UTM X:${utm.x || "-"} Y:${utm.y || "-"} Fuso:${utm.fuso || "-"}`;
    }
    const ponto = outorga.pontosDeMonitoramento?.find((p) => p.lat != null && p.lng != null);
    if (ponto?.lat != null && ponto?.lng != null) {
      return `${ponto.lat}, ${ponto.lng}`;
    }
    return "N/A";
  }, [outorga, projects]);

  const handleExportCompliancePdf = () => {
    if (!outorga) return;
    const selectedYear = Number(yearFilter);
    const referenceDate =
      monthFilter === "ano_todo"
        ? new Date(`${selectedYear}-01-01`)
        : new Date(selectedYear, Number(monthFilter), 1);
    const report =
      compliance ??
      calculateWaterCompliance(reportReadings, outorga, referenceDate);
    generateWaterCompliancePDF(outorga, report, referenceDate, reportReadings, {
      empreendedorName,
      empreendimentoName,
      coordinates: empreendimentoCoordinates,
    });
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Lançamento Manual" />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seleção do Ponto de Monitoramento</CardTitle>
              <CardDescription>
                Selecione a outorga e o ponto de monitoramento para ver ou
                adicionar registros.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={selectedOutorga}
                onValueChange={setSelectedOutorga}
                disabled={isLoadingOutorgasList}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingOutorgasList
                        ? "Carregando..."
                        : "Selecione uma Outorga"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {outorgasManuais.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.permitNumber} - {o.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedPonto}
                onValueChange={setSelectedPonto}
                disabled={
                  !outorga || outorga.pontosDeMonitoramento.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !outorga
                        ? "Selecione uma outorga primeiro"
                        : "Selecione um Ponto"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {outorga?.pontosDeMonitoramento.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedPonto && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Lançamentos de Monitoramento</CardTitle>
                    <CardDescription>
                      Visualize e gerencie os registros diários para o ponto
                      selecionado.
                    </CardDescription>
                  </div>
                  {canPerformWriteActions(user) && (
                    <Button size="sm" className="gap-1" onClick={handleAddNew}>
                      <PlusCircle className="h-4 w-4" />
                      Adicionar Lançamento
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-muted-foreground">Ano de referência:</p>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          new Set([
                            ...telemetryFromManualLogs.map((r) =>
                              String(new Date(r.timestamp).getFullYear()),
                            ),
                            String(new Date().getFullYear()),
                          ]),
                        )
                          .sort((a, b) => Number(b) - Number(a))
                          .map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Mês:</p>
                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                      <SelectTrigger className="w-[170px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ano_todo">Ano todo</SelectItem>
                        <SelectItem value="0">Janeiro</SelectItem>
                        <SelectItem value="1">Fevereiro</SelectItem>
                        <SelectItem value="2">Março</SelectItem>
                        <SelectItem value="3">Abril</SelectItem>
                        <SelectItem value="4">Maio</SelectItem>
                        <SelectItem value="5">Junho</SelectItem>
                        <SelectItem value="6">Julho</SelectItem>
                        <SelectItem value="7">Agosto</SelectItem>
                        <SelectItem value="8">Setembro</SelectItem>
                        <SelectItem value="9">Outubro</SelectItem>
                        <SelectItem value="10">Novembro</SelectItem>
                        <SelectItem value="11">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleExportCompliancePdf}>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar PDF do Relatório
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-5">
                        <p className="text-sm text-muted-foreground">Volume captado (ano)</p>
                        <p className="text-2xl font-bold">{dashboardTotals.totalVolume.toLocaleString("pt-BR")} m³</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-5">
                        <p className="text-sm text-muted-foreground">Horas de captação</p>
                        <p className="text-2xl font-bold">{dashboardTotals.totalHours.toLocaleString("pt-BR")} h</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-5">
                        <p className="text-sm text-muted-foreground">Dias ativos</p>
                        <p className="text-2xl font-bold">{dashboardTotals.activeDays}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-5">
                        <p className="text-sm text-muted-foreground">Status de restrições</p>
                        {compliance && compliance.alerts.length === 0 ? (
                          <p className="text-sm font-semibold text-green-600 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Operação normal
                          </p>
                        ) : (
                          <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {compliance?.alerts.length || 0} alerta(s)
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Volume por mês (m³)</CardTitle>
                      </CardHeader>
                      <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyDashboardData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Legend />
                            <Bar dataKey="volume" name="Volume (m³)" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Horas e dias por mês</CardTitle>
                      </CardHeader>
                      <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyDashboardData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Legend />
                            <Line type="monotone" dataKey="hours" name="Horas" stroke="#2563eb" strokeWidth={2} />
                            <Line type="monotone" dataKey="days" name="Dias" stroke="#16a34a" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {compliance && compliance.alerts.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Mensagens de atenção (filtros do relatório)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {compliance.alerts.map((a, idx) => (
                          <p key={`${a.type}-${idx}`} className="text-sm text-red-700">
                            - {a.message}
                          </p>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Horímetro Início
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Horímetro Fim
                      </TableHead>
                      <TableHead>Vazão (L/s)</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Vazão (m³/h)
                      </TableHead>
                      {canPerformWriteActions(user) && (
                        <TableHead>
                          <span className="sr-only">Ações</span>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLogs &&
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoadingLogs &&
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{formatDate(log.logDate)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {log.horimeterStart}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {log.horimeterEnd}
                          </TableCell>
                          <TableCell>{log.flowRateLps}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {log.flowRateM3h}
                          </TableCell>
                          {canPerformWriteActions(user) && (
                            <TableCell>
                              <TooltipProvider>
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(log)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Editar lançamento</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => openDeleteConfirm(log.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Deletar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Deletar lançamento</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    {!isLoadingLogs && filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhum lançamento encontrado para este ponto.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md h-full max-h-[90dvh] flex flex-col">
          <MonitoringForm
            currentItem={editingItem}
            outorgaId={selectedOutorga}
            pontoId={selectedPonto}
            permit={outorga}
            existingReadings={telemetryFromManualLogs}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e irá deletar o registro
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


