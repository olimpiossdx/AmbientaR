"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GeorefChecklist } from "@/components/georeferenciamento/georef-checklist";
import { GeorefClientProjectFields } from "@/components/georeferenciamento/georef-client-project-fields";
import { GeorefVerticesImportPanel } from "@/components/georeferenciamento/georef-vertices-import-panel";
import { useToast } from "@/hooks/use-toast";
import type { GeorefProject, GeorefStatus, GeorefTipo } from "@/lib/georeferenciamento/types";
import {
  GEOREF_STATUS_LABELS,
  GEOREF_TIPO_LABELS,
} from "@/lib/georeferenciamento/types";
import { mapGeorefProjectDoc } from "@/lib/georeferenciamento/map-doc";
import { getProcessoById, PROCESSO_RURAL_SIGEF } from "@/lib/georeferenciamento/processos";
import {
  projectToGeorefFields,
  useGeorefClientProject,
} from "@/hooks/use-georef-client-project";
import type { StudyAreaGeoJSON } from "@/components/maps/study-area-map";
import { ImovelLocalizadorPanel } from "@/components/geospatial/imovel-localizador-panel";
import { localizacaoToGeorefPatch } from "@/lib/geospatial/localizacao-request-snapshot";
import type { LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";
import { ArrowLeft, Save } from "lucide-react";

export function GeorefProcessoDetailView() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [project, setProject] = React.useState<GeorefProject | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [clientId, setClientId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");

  const { selectedClient, selectedProject } = useGeorefClientProject(clientId, projectId);

  React.useEffect(() => {
    if (!firestore || !id) return;
    const unsub = onSnapshot(doc(firestore, "georef_projects", id), (snap) => {
      if (snap.exists()) {
        const mapped = mapGeorefProjectDoc(snap.id, snap.data() as Record<string, unknown>);
        setProject(mapped);
        setClientId(mapped.clientId ?? "");
        setProjectId(mapped.projectId ?? "");
      } else {
        setProject(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [firestore, id]);

  const processo =
    project?.tipo === "urbano"
      ? getProcessoById("urbano-cartorio")
      : project?.tipo === "ambiental"
        ? getProcessoById("ambiental-car")
        : PROCESSO_RURAL_SIGEF;

  const polygon = (project?.polygonGeojson as StudyAreaGeoJSON | undefined) ?? null;

  const save = async (patch: Record<string, unknown>) => {
    if (!firestore || !project) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "georef_projects", project.id), {
        ...patch,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: "Salvo." });
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLocalizacaoConfirmed = (resolved: LocalizacaoResolvida) => {
    if (!project) return;
    const patch = localizacaoToGeorefPatch(resolved);
    setProject((prev) =>
      prev
        ? {
            ...prev,
            car: patch.car ?? undefined,
            areaHa: patch.areaHa,
            municipio: patch.municipio ?? undefined,
            uf: patch.uf ?? undefined,
            polygonGeojson: patch.polygonGeojson,
            localizacaoImovel: patch.localizacaoImovel,
          }
        : prev,
    );
    void save(patch);
  };

  const applyClientProject = () => {
    if (!project) return;
    const pf = selectedProject ? projectToGeorefFields(selectedProject) : null;
    void save({
      clientId: clientId || null,
      clientName: selectedClient?.name ?? null,
      projectId: projectId || null,
      projectName: pf?.projectName ?? null,
      municipio: project.municipio || pf?.municipio || null,
      uf: project.uf || pf?.uf || "MG",
      matricula: project.matricula || pf?.matricula || null,
      car: project.car || pf?.car || null,
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-64" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Processo n├úo encontrado.{" "}
        <Link href="/georeferenciamento/processos" className="text-primary underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={project.title}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/georeferenciamento/processos">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Tr├ómites fundi├írios
          </Link>
        </Button>
      </PageHeader>
      <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{GEOREF_TIPO_LABELS[project.tipo]}</Badge>
              <Badge variant="secondary">{GEOREF_STATUS_LABELS[project.status]}</Badge>
            </div>
            <GeorefClientProjectFields
              clientId={clientId}
              projectId={projectId}
              onClientIdChange={setClientId}
              onProjectIdChange={setProjectId}
            />
            <Button type="button" variant="outline" size="sm" onClick={applyClientProject}>
              Vincular cliente / empreendimento
            </Button>
            <ImovelLocalizadorPanel
              initialCarCod={project.car}
              defaultInputMode={project.tipo === "ambiental" ? "car" : "gps"}
              extratoMgObrigatorioParaConfirmar={false}
              disabled={saving}
              onConfirmed={handleLocalizacaoConfirmed}
            />
            {project.localizacaoImovel ? (
              <p className="text-xs text-muted-foreground">
                Localiza├º├úo SICAR confirmada ┬À {project.localizacaoImovel.areaHa.toFixed(2)} ha ┬À{" "}
                {project.localizacaoImovel.municipio}/{project.localizacaoImovel.uf} ┬À m├®todo{" "}
                {project.localizacaoImovel.metodoEntrada}
              </p>
            ) : null}
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={project.status}
                  onValueChange={(v) =>
                    setProject({ ...project, status: v as GeorefStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(GEOREF_STATUS_LABELS) as GeorefStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {GEOREF_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>├ürea (ha)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={project.areaHa ?? ""}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        areaHa: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Munic├¡pio / UF</Label>
                  <div className="flex gap-2">
                    <Input
                      value={project.municipio ?? ""}
                      onChange={(e) => setProject({ ...project, municipio: e.target.value })}
                      placeholder="Munic├¡pio"
                    />
                    <Input
                      className="w-20"
                      value={project.uf ?? ""}
                      onChange={(e) => setProject({ ...project, uf: e.target.value })}
                      placeholder="UF"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Matr├¡cula</Label>
                <Input
                  value={project.matricula ?? ""}
                  onChange={(e) => setProject({ ...project, matricula: e.target.value })}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>CAR (recibo)</Label>
                  <Input
                    value={project.car ?? ""}
                    onChange={(e) => setProject({ ...project, car: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>CCIR</Label>
                  <Input
                    value={project.ccir ?? ""}
                    onChange={(e) => setProject({ ...project, ccir: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Respons├ível t├®cnico</Label>
                  <Input
                    value={project.responsavelTecnico ?? ""}
                    onChange={(e) =>
                      setProject({ ...project, responsavelTecnico: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>ART / RRT</Label>
                  <Input
                    value={project.artRrt ?? ""}
                    onChange={(e) => setProject({ ...project, artRrt: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Parcela SIGEF (ID)</Label>
                <Input
                  value={project.sigefParcelaId ?? ""}
                  onChange={(e) =>
                    setProject({ ...project, sigefParcelaId: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Observa├º├Áes</Label>
                <Textarea
                  value={project.notes ?? ""}
                  onChange={(e) => setProject({ ...project, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <Button
              onClick={() =>
                void save({
                  status: project.status,
                  matricula: project.matricula,
                  car: project.car,
                  ccir: project.ccir,
                  areaHa: project.areaHa ?? null,
                  municipio: project.municipio ?? null,
                  uf: project.uf ?? null,
                  localizacaoImovel: project.localizacaoImovel ?? null,
                  responsavelTecnico: project.responsavelTecnico,
                  artRrt: project.artRrt,
                  sigefParcelaId: project.sigefParcelaId,
                  notes: project.notes,
                })
              }
              disabled={saving}
            >
              <Save className="mr-1 h-4 w-4" />
              Salvar dados
            </Button>
          </div>

          <div className="space-y-4">
            <GeorefVerticesImportPanel
              vertices={project.vertices ?? []}
              polygon={polygon}
              onImport={(data) => {
                setProject((prev) =>
                  prev
                    ? {
                        ...prev,
                        vertices: data.vertices,
                        polygonGeojson: data.polygonGeojson ?? prev.polygonGeojson,
                        verticesMeta: data.verticesMeta,
                      }
                    : prev,
                );
                void save({
                  vertices: data.vertices,
                  polygonGeojson: data.polygonGeojson ?? null,
                  verticesMeta: data.verticesMeta ?? null,
                });
              }}
              onPolygonChange={(geo) => {
                setProject((prev) => (prev ? { ...prev, polygonGeojson: geo ?? undefined } : prev));
                void save({ polygonGeojson: geo ?? null });
              }}
            />
            {processo ? (
              <GeorefChecklist
                titulo={processo.titulo}
                items={processo.checklist}
                value={project.checklist}
                onChange={(checklist) => {
                  setProject({ ...project, checklist });
                  void save({ checklist });
                }}
              />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
