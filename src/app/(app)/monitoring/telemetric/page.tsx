"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import type {
  WaterPermit,
  PontoDeMonitoramento,
  TelemetryReading,
  InsignificantWaterUse,
  Empreendedor,
  Project,
} from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  buildMiraReadyCsv,
  buildMiraReadyJson,
  downloadTextFile,
  fingerprintExportContent,
  MIRA_EXPORT_SCHEMA_VERSION,
  suggestedMiraExportBasename,
  type MiraExportAlvo,
} from "@/lib/mira-export";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase";
import { useJsApiLoader } from "@react-google-maps/api";
import dynamic from "next/dynamic";
import { GOOGLE_MAPS_API_KEY, hasGoogleMapsApiKey } from "@/lib/google-maps";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Droplets,
  Calendar,
  Zap,
  AlertTriangle,
  Download,
  FileJson,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calculateWaterCompliance } from "@/lib/water-compliance-engine";
import { generateWaterCompliancePDF } from "@/lib/export-water-report";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isClientePortalRole } from "@/lib/role-guards";

// Carrega componentes do Google Maps sob demanda (reduz tamanho do bundle inicial).
const GoogleMap = dynamic(
  () => import("@react-google-maps/api").then((m) => m.GoogleMap),
  { ssr: false },
);
const Marker = dynamic(
  () => import("@react-google-maps/api").then((m) => m.Marker),
  { ssr: false },
);
const InfoWindow = dynamic(
  () => import("@react-google-maps/api").then((m) => m.InfoWindow),
  { ssr: false },
);

const DEFAULT_CENTER = { lat: -19.9167, lng: -43.9345 }; // Belo Horizonte, MG
const MAP_CONTAINER_STYLE = { width: "100%", height: "400px", borderRadius: 8 };

/** Mensagem de erro quando o mapa não carrega (chave inválida, API não ativada, restrições ou faturamento). */
function MapErrorHelp() {
  return (
    <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
      <p className="font-medium text-destructive mb-2">
        Não foi possível carregar o Google Maps.
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        Se aparecer &quot;Oops! Something went wrong&quot;, confira no Google
        Cloud Console (mesmo projeto do Firebase):
      </p>
      <ul className="text-left text-sm text-muted-foreground space-y-1 list-disc list-inside">
        <li>
          <strong>APIs e serviços → Biblioteca</strong>: ative a{" "}
          <strong>Maps JavaScript API</strong>.
        </li>
        <li>
          <strong>Faturamento</strong>: vincule uma conta de faturamento ao
          projeto (há crédito gratuito).
        </li>
        <li>
          <strong>Credenciais → sua chave API</strong>: em &quot;Restrições de
          aplicativo&quot;, adicione como referenciador{" "}
          <code className="bg-muted px-1 rounded">http://localhost:9002/*</code>{" "}
          (e seu domínio em produção).
        </li>
      </ul>
    </div>
  );
}

/** Carrega o script do Maps apenas quando a chave existe e renderiza o mapa. */
function TelemetricMapBlock({
  mapCenter,
  pontosComCoordenadas,
  infoMarkerId,
  setInfoMarkerId,
}: {
  mapCenter: { lat: number; lng: number };
  pontosComCoordenadas: PontoDeMonitoramento[];
  infoMarkerId: string | null;
  setInfoMarkerId: (id: string | null) => void;
}) {
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    preventGoogleFontsLoading: true,
  });

  if (mapLoadError) return <MapErrorHelp />;
  if (!isMapLoaded) return <Skeleton className="w-full h-64" />;

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={mapCenter}
      zoom={pontosComCoordenadas.length > 0 ? 14 : 10}
      options={{ fullscreenControl: true, streetViewControl: false }}
    >
      {pontosComCoordenadas.map((p) => (
        <Marker
          key={p.id}
          position={{ lat: p.lat!, lng: p.lng! }}
          title={p.nome}
          onClick={() => setInfoMarkerId(infoMarkerId === p.id ? null : p.id)}
          icon={undefined}
        />
      ))}
      {infoMarkerId &&
        (() => {
          const p = pontosComCoordenadas.find((x) => x.id === infoMarkerId);
          if (!p || p.lat == null || p.lng == null) return null;
          return (
            <InfoWindow
              position={{ lat: p.lat, lng: p.lng }}
              onCloseClick={() => setInfoMarkerId(null)}
            >
              <div className="p-1 min-w-[180px]">
                <p className="font-semibold">{p.nome}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {p.tipo || "Ponto"}
                </p>
                <p className="text-xs mt-1">
                  Vazão instantânea: — m³/s / — m³/h
                  <span className="block text-muted-foreground">
                    (dados da telemetria em implementação)
                  </span>
                </p>
                <p className="text-xs flex items-center gap-1 mt-1">
                  <Zap className="h-3 w-3" /> Bomba: —
                  <span className="text-muted-foreground">
                    (ligada/desligada)
                  </span>
                </p>
                <p className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Alertas: residual a
                  jusante conforme IGAM/ANA
                </p>
              </div>
            </InfoWindow>
          );
        })()}
    </GoogleMap>
  );
}

type TelemetriaFonte = "outorga" | "uso_insignificante";

export default function TelemetricMonitoringPage() {
  const [telemetryFonte, setTelemetryFonte] =
    useState<TelemetriaFonte>("outorga");
  const [selectedOutorgaId, setSelectedOutorgaId] = useState<string>("");
  const [selectedUsoId, setSelectedUsoId] = useState<string>("");
  const [infoMarkerId, setInfoMarkerId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [yearFilter, setYearFilter] = useState<string>(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState<string>("ano_todo");
  const [lastExportFingerprint, setLastExportFingerprint] = useState<
    string | null
  >(null);
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<
    string[] | undefined
  >(undefined);

  const firestore = useFirestore();
  const { user } = useAuth();

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

  const { data: allOutorgas, isLoading: isLoadingOutorgas } =
    useCollection<WaterPermit>(outorgasQuery);
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

  const usosInsignificantesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (isClientePortalRole(user.role) || user.role === "representative") {
      if (empreendedorIdsForUser === undefined) return null;
      if (
        empreendedorIdsForUser.length === 0 ||
        empreendedorIdsForUser[0] === "__none__"
      ) {
        return query(
          collection(firestore, "usosInsignificantes"),
          where("empreendedorId", "==", "__none__"),
        );
      }
      return query(
        collection(firestore, "usosInsignificantes"),
        where("empreendedorId", "in", empreendedorIdsForUser.slice(0, 10)),
      );
    }
    return collection(firestore, "usosInsignificantes");
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: allUsosInsignificantes, isLoading: isLoadingUsos } =
    useCollection<InsignificantWaterUse>(usosInsignificantesQuery);

  const outorgasTelemetrizadas = useMemo(() => {
    if (!allOutorgas) return [];
    return allOutorgas.filter((o) => o.monitoringType === "telemetric");
  }, [allOutorgas]);

  const usosTelemetrizados = useMemo(() => {
    if (!allUsosInsignificantes) return [];
    return allUsosInsignificantes.filter((u) => u.monitoringType === "telemetric");
  }, [allUsosInsignificantes]);

  const selectedOutorga = useMemo(
    () => outorgasTelemetrizadas.find((o) => o.id === selectedOutorgaId),
    [outorgasTelemetrizadas, selectedOutorgaId],
  );

  const selectedUso = useMemo(
    () => usosTelemetrizados.find((u) => u.id === selectedUsoId),
    [usosTelemetrizados, selectedUsoId],
  );

  const registroAtivo = useMemo(() => {
    return telemetryFonte === "outorga" ? selectedOutorga ?? null : selectedUso ?? null;
  }, [telemetryFonte, selectedOutorga, selectedUso]);

  const miraExportAlvo = useMemo((): MiraExportAlvo | null => {
    if (telemetryFonte === "outorga" && selectedOutorga) {
      return { tipo: "outorga", registro: selectedOutorga };
    }
    if (telemetryFonte === "uso_insignificante" && selectedUso) {
      return { tipo: "uso_insignificante", registro: selectedUso };
    }
    return null;
  }, [telemetryFonte, selectedOutorga, selectedUso]);

  const telemetryReadingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (telemetryFonte === "outorga" && selectedOutorgaId) {
      return query(
        collection(firestore, "telemetryReadings"),
        where("outorgaId", "==", selectedOutorgaId),
        limit(5000),
      );
    }
    if (telemetryFonte === "uso_insignificante" && selectedUsoId) {
      return query(
        collection(firestore, "telemetryReadings"),
        where("usoInsignificanteId", "==", selectedUsoId),
        limit(5000),
      );
    }
    return null;
  }, [firestore, telemetryFonte, selectedOutorgaId, selectedUsoId]);

  const { data: telemetryRows, isLoading: isLoadingTelemetry } =
    useCollection<TelemetryReading>(telemetryReadingsQuery);

  const filteredTelemetryReadings = useMemo(() => {
    if (!telemetryRows?.length) return [];
    let rows = [...telemetryRows];
    if (dateFrom) {
      const t0 = new Date(`${dateFrom}T00:00:00.000Z`).getTime();
      rows = rows.filter(
        (r) => new Date(r.timestamp).getTime() >= t0,
      );
    }
    if (dateTo) {
      const t1 = new Date(`${dateTo}T23:59:59.999Z`).getTime();
      rows = rows.filter(
        (r) => new Date(r.timestamp).getTime() <= t1,
      );
    }
    rows.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    return rows;
  }, [telemetryRows, dateFrom, dateTo]);

  const reportReadings = useMemo(() => {
    const selectedYear = Number(yearFilter);
    const selectedMonth = monthFilter === "ano_todo" ? null : Number(monthFilter);
    return filteredTelemetryReadings.filter((r) => {
      const d = new Date(r.timestamp);
      if (Number.isNaN(d.getTime())) return false;
      if (Number.isFinite(selectedYear) && d.getFullYear() !== selectedYear) return false;
      if (selectedMonth != null && d.getMonth() !== selectedMonth) return false;
      return true;
    });
  }, [filteredTelemetryReadings, yearFilter, monthFilter]);

  const compliancePermit = useMemo<WaterPermit | null>(() => {
    if (telemetryFonte === "outorga") {
      return selectedOutorga ?? null;
    }
    if (!selectedUso) return null;
    return {
      id: selectedUso.id,
      empreendedorId: selectedUso.empreendedorId,
      projectId: selectedUso.projectId,
      permitNumber: selectedUso.permitNumber,
      processNumber: selectedUso.processNumber,
      issueDate: selectedUso.issueDate,
      expirationDate: selectedUso.expirationDate,
      status: selectedUso.status,
      description: selectedUso.description,
      fileUrl: selectedUso.fileUrl,
      monitoringType: selectedUso.monitoringType,
      pontosDeMonitoramento: selectedUso.pontosDeMonitoramento,
      miraStationId: selectedUso.miraStationId,
      condicionanteFlowLimitM3s: selectedUso.condicionanteFlowLimitM3s,
      monthlyLimitM3: selectedUso.monthlyLimitM3,
      dailyLimitM3: selectedUso.dailyLimitM3,
      dailyHoursLimit: selectedUso.dailyHoursLimit,
      maxDaysPerMonth: selectedUso.maxDaysPerMonth,
    };
  }, [telemetryFonte, selectedOutorga, selectedUso]);

  const compliance = useMemo(() => {
    if (!compliancePermit) return null;
    const selectedYear = Number(yearFilter);
    const referenceDate =
      monthFilter === "ano_todo"
        ? new Date(`${selectedYear}-01-01`)
        : new Date(selectedYear, Number(monthFilter), 1);
    return calculateWaterCompliance(reportReadings, compliancePermit, referenceDate);
  }, [reportReadings, compliancePermit, yearFilter, monthFilter]);

  const empreendedorName = useMemo(() => {
    if (!compliancePermit || !empreendedores) return "N/A";
    return empreendedores.find((e) => e.id === compliancePermit.empreendedorId)?.name || "N/A";
  }, [compliancePermit, empreendedores]);

  const empreendimentoName = useMemo(() => {
    if (!compliancePermit?.projectId || !projects) return "N/A";
    return projects.find((p) => p.id === compliancePermit.projectId)?.propertyName || "N/A";
  }, [compliancePermit, projects]);

  const empreendimentoCoordinates = useMemo(() => {
    if (!compliancePermit) return "N/A";
    const project = projects?.find((p) => p.id === compliancePermit.projectId);
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
    const ponto = compliancePermit.pontosDeMonitoramento?.find((p) => p.lat != null && p.lng != null);
    if (ponto?.lat != null && ponto?.lng != null) {
      return `${ponto.lat}, ${ponto.lng}`;
    }
    return "N/A";
  }, [compliancePermit, projects]);

  const pontosComCoordenadas = useMemo(() => {
    const pontos = registroAtivo?.pontosDeMonitoramento;
    if (!pontos) return [];
    return pontos.filter(
      (p: PontoDeMonitoramento) => p.lat != null && p.lng != null,
    ) as PontoDeMonitoramento[];
  }, [registroAtivo]);

  const mapCenter = useMemo(() => {
    if (pontosComCoordenadas.length === 0) return DEFAULT_CENTER;
    const lat =
      pontosComCoordenadas.reduce((s, p) => s + (p.lat ?? 0), 0) /
      pontosComCoordenadas.length;
    const lng =
      pontosComCoordenadas.reduce((s, p) => s + (p.lng ?? 0), 0) /
      pontosComCoordenadas.length;
    return { lat, lng };
  }, [pontosComCoordenadas]);

  const isLoadingList =
    isLoadingOutorgas ||
    isLoadingUsos ||
    ((isClientePortalRole(user?.role) || user?.role === "representative") &&
      empreendedorIdsForUser === undefined);

  const handleReportVazaoCaptada = () => {
    // TODO: gerar relatório de vazão captada (PDF/XLSX)
  };
  const handleReportVazaoJusante = () => {
    // TODO: gerar relatório de vazão a jusante (PDF/XLSX)
  };
  const handleReportPeriodo = () => {
    // TODO: período dateFrom-dateTo → relatório consolidado PDF e XLSX
  };
  const handleExportCompliancePdf = () => {
    if (!compliancePermit || !compliance) return;
    const selectedYear = Number(yearFilter);
    const referenceDate =
      monthFilter === "ano_todo"
        ? new Date(`${selectedYear}-01-01`)
        : new Date(selectedYear, Number(monthFilter), 1);
    generateWaterCompliancePDF(
      compliancePermit,
      compliance,
      referenceDate,
      reportReadings,
      {
        empreendedorName,
        empreendimentoName,
        coordinates: empreendimentoCoordinates,
      },
    );
  };

  const handleExportMiraCsv = () => {
    if (!miraExportAlvo) return;
    const generatedAtIso = new Date().toISOString();
    const csv = buildMiraReadyCsv(filteredTelemetryReadings, {
      alvo: miraExportAlvo,
      generatedAtIso,
    });
    setLastExportFingerprint(fingerprintExportContent(csv));
    downloadTextFile(
      `${suggestedMiraExportBasename(miraExportAlvo)}.csv`,
      csv,
      "text/csv;charset=utf-8",
    );
  };

  const handleExportMiraJson = () => {
    if (!miraExportAlvo) return;
    const generatedAtIso = new Date().toISOString();
    const json = buildMiraReadyJson(filteredTelemetryReadings, {
      alvo: miraExportAlvo,
      generatedAtIso,
    });
    setLastExportFingerprint(fingerprintExportContent(json));
    downloadTextFile(
      `${suggestedMiraExportBasename(miraExportAlvo)}.json`,
      json,
      "application/json;charset=utf-8",
    );
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Telemetria (Real-time)" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Monitoramento telemétrico</CardTitle>
            <CardDescription>
              Outorgas ou usos insignificantes com leitura Telemétrica. Mapa,
              séries e export MIRA-ready (IGAM/ANA).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-80 shrink-0 space-y-3">
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      telemetryFonte === "outorga" ? "default" : "outline"
                    }
                    onClick={() => {
                      setTelemetryFonte("outorga");
                      setSelectedUsoId("");
                    }}
                  >
                    Outorgas
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      telemetryFonte === "uso_insignificante"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => {
                      setTelemetryFonte("uso_insignificante");
                      setSelectedOutorgaId("");
                    }}
                  >
                    Usos insignificantes
                  </Button>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {telemetryFonte === "outorga"
                    ? "Selecione a portaria"
                    : "Selecione o uso"}
                </p>
                {isLoadingList ? (
                  <Skeleton className="h-10 w-full rounded-md" />
                ) : telemetryFonte === "outorga" ? (
                  <div className="border rounded-md max-h-52 overflow-y-auto divide-y">
                    {outorgasTelemetrizadas.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">
                        Nenhuma outorga telemétrica. Em Outorgas, defina tipo de
                        leitura Telemétrica.
                      </p>
                    ) : (
                      outorgasTelemetrizadas.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setSelectedOutorgaId(o.id)}
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                            selectedOutorgaId === o.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <span className="font-medium">{o.permitNumber}</span>
                          <span className="block text-xs opacity-90 truncate">
                            {o.description}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="border rounded-md max-h-52 overflow-y-auto divide-y">
                    {usosTelemetrizados.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">
                        Nenhum uso insignificante telemétrico. Cadastre com leitura
                        Telemétrica.
                      </p>
                    ) : (
                      usosTelemetrizados.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUsoId(u.id)}
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                            selectedUsoId === u.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <span className="font-medium">{u.permitNumber}</span>
                          <span className="block text-xs opacity-90 truncate">
                            {u.usoType} · {u.description}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-4">
                {registroAtivo && (
                  <>
                    <div className="space-y-3">
                      <TooltipProvider>
                        <div className="grid grid-cols-1 gap-2 md:flex md:flex-wrap md:items-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start md:w-auto"
                                onClick={handleReportVazaoCaptada}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Relatório de vazão captada
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Gera relatório de vazão captada (PDF/XLSX)
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start md:w-auto"
                                onClick={handleReportVazaoJusante}
                              >
                                <Droplets className="h-4 w-4 mr-1" />
                                Relatório de vazão a jusante
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Gera relatório de vazão a jusante (PDF/XLSX)
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start md:w-auto"
                                onClick={handleExportCompliancePdf}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Gerar PDF de Conformidade
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Relatório consolidado do período em PDF
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                      <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-[auto,110px,auto,170px,1fr] md:items-center">
                        <span>Ano:</span>
                        <Select value={yearFilter} onValueChange={setYearFilter}>
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(
                              new Set([
                                ...filteredTelemetryReadings.map((r) =>
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
                        <span>Mês:</span>
                        <Select value={monthFilter} onValueChange={setMonthFilter}>
                          <SelectTrigger className="h-9 w-full">
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
                        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                          <label className="sr-only">Data inicial</label>
                          <input
                            type="date"
                            aria-label="Data inicial do período"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="h-9 border rounded px-2 py-1"
                          />
                          <span className="text-center">até</span>
                          <label className="sr-only">Data final</label>
                          <input
                            type="date"
                            aria-label="Data final do período"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="h-9 border rounded px-2 py-1"
                          />
                        </div>
                      </div>
                    </div>

                    <Alert>
                      <AlertTitle>
                        Exportação MIRA-ready (IGAM-MG) — schema{" "}
                        {MIRA_EXPORT_SCHEMA_VERSION}
                      </AlertTitle>
                      <AlertDescription className="space-y-3 text-left mt-2">
                        <p>
                          CSV/JSON com colunas estáveis para evolução conforme o
                          manual oficial do MIRA. Ajuste período acima para
                          filtrar linhas. Checklist de compliance:{" "}
                          <code className="rounded bg-muted px-1 text-xs">
                            docs/CHECKLIST-PRODUCT-COMPLIANCE-TELEMETRIA-MIRA.md
                          </code>
                          .
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleExportMiraCsv}
                            disabled={!miraExportAlvo}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar CSV
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleExportMiraJson}
                            disabled={!miraExportAlvo}
                          >
                            <FileJson className="h-4 w-4 mr-1" />
                            Baixar JSON
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {isLoadingTelemetry
                              ? "Carregando leituras…"
                              : `${filteredTelemetryReadings.length} linha(s) no período selecionado`}
                          </span>
                        </div>
                        {lastExportFingerprint ? (
                          <p className="text-xs text-muted-foreground font-mono">
                            Último checksum (export): {lastExportFingerprint}
                          </p>
                        ) : null}
                      </AlertDescription>
                    </Alert>

                    {compliance && (
                      <>
                        <div className="grid gap-4 md:grid-cols-3">
                          <Card className={compliance.isExceeded ? "border-red-500" : undefined}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">
                                Uso da Outorga Mensal
                              </CardTitle>
                              <Droplets
                                className={
                                  compliance.isExceeded ? "h-5 w-5 text-red-500" : "h-5 w-5 text-green-600"
                                }
                              />
                            </CardHeader>
                            <CardContent>
                              <div className="text-3xl font-bold">
                                {compliance.usagePercentage.toFixed(1)}%
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {compliance.totalVolumeMonth.toFixed(2)} m³ captados no mês
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">
                                Status de Compliance
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {compliance.alerts.length === 0 ? (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span className="font-semibold">Operação normal</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-red-600">
                                  <AlertTriangle className="h-5 w-5" />
                                  <span className="font-semibold">
                                    {compliance.alerts.length} restrição(ões)
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Dias ativos no mês</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-3xl font-bold">{compliance.activeDaysCount}</div>
                              <p className="text-xs text-muted-foreground">
                                Limite cadastrado: {compliancePermit.maxDaysPerMonth ?? "Não informado"}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              Pontos de Atenção (Restrições Detectadas)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {compliance.alerts.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                Nenhuma restrição detectada para o período selecionado.
                              </p>
                            ) : (
                              compliance.alerts.map((alert, index) => (
                                <div
                                  key={`${alert.type}-${alert.date || "mensal"}-${index}`}
                                  className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3"
                                >
                                  <Badge
                                    variant={alert.severity === "critical" ? "destructive" : "outline"}
                                  >
                                    {alert.type.replace("_", " ")}
                                  </Badge>
                                  <div>
                                    <p className="text-sm font-medium">{alert.message}</p>
                                    {alert.date ? (
                                      <p className="text-xs text-muted-foreground">
                                        Ocorrência em: {alert.date}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              ))
                            )}
                          </CardContent>
                        </Card>
                      </>
                    )}

                    <div className="rounded-lg border overflow-hidden bg-muted/30">
                      {!hasGoogleMapsApiKey() ? (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                          Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no .env e
                          reinicie o servidor.
                        </div>
                      ) : (
                        <TelemetricMapBlock
                          mapCenter={mapCenter}
                          pontosComCoordenadas={pontosComCoordenadas}
                          infoMarkerId={infoMarkerId}
                          setInfoMarkerId={setInfoMarkerId}
                        />
                      )}
                    </div>
                    {registroAtivo.pontosDeMonitoramento.length > 0 &&
                      pontosComCoordenadas.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Adicione coordenadas (lat/lng) aos pontos de
                          monitoramento no cadastro para exibi-los no mapa.
                        </p>
                      )}
                  </>
                )}

                {!registroAtivo &&
                  !isLoadingList &&
                  (telemetryFonte === "outorga"
                    ? outorgasTelemetrizadas.length > 0
                    : usosTelemetrizados.length > 0) && (
                  <div className="flex items-center justify-center border-2 border-dashed rounded-lg h-64 text-muted-foreground">
                    Selecione um item na lista ao lado.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
