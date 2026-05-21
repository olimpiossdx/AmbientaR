"use client";

import * as React from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DEFAULT_AIA_PROFILE,
  IEF_INTERVENTION_REFERENCE_DOCS,
  INTERVENTION_SUBSERVICES,
  TIPO_INTERVENCAO_AIA_OPTIONS,
  buildInterventionChecklist,
  getChecklistPhases,
  getChecklistProgress,
  getChecklistStatusBadgeClass,
  getChecklistStatusLabel,
  mergeInterventionChecklist,
  type AiaChecklistContext,
  type AiaImovelSnapshot,
  type InterventionChecklistItem,
  type InterventionSubserviceId,
  type TipoIntervencaoAia,
} from "@/lib/intervention-checklist";
import { buildAiaModuleHref } from "@/lib/aia-links";
import { collectAiaAlerts } from "@/lib/aia-validation";
import type { AiaLinkedArtifacts, AiaProfile, Project, Request } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import { ExternalLink, Loader2, RefreshCw, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type AiaWorkflowPanelProps = {
  requestId?: string;
  empreendedorId?: string;
  projectId?: string;
  interventionSubservices: InterventionSubserviceId[];
  onSubservicesChange: (ids: InterventionSubserviceId[]) => void;
  tipoIntervencao?: TipoIntervencaoAia;
  onTipoIntervencaoChange: (tipo: TipoIntervencaoAia | undefined) => void;
  imovelSnapshot: AiaImovelSnapshot;
  onImovelSnapshotChange: (snap: AiaImovelSnapshot) => void;
  aiaProfile?: AiaProfile;
  checklist: InterventionChecklistItem[];
  onChecklistChange: (items: InterventionChecklistItem[]) => void;
  linkedArtifacts?: AiaLinkedArtifacts;
  onLinkedArtifactsChange?: (linked: AiaLinkedArtifacts) => void;
  uploadStoragePrefix: string;
  showMergeTemplate?: boolean;
  readOnly?: boolean;
};

function buildContext(
  subservices: InterventionSubserviceId[],
  imovel: AiaImovelSnapshot,
  tipo?: TipoIntervencaoAia,
  profile?: AiaProfile,
): AiaChecklistContext {
  return {
    subservices,
    imovel,
    tipoIntervencao: tipo,
    orgao: profile?.orgao ?? DEFAULT_AIA_PROFILE.orgao,
    uf: profile?.uf ?? DEFAULT_AIA_PROFILE.uf,
  };
}

export function AiaWorkflowPanel({
  requestId,
  empreendedorId,
  projectId,
  interventionSubservices,
  onSubservicesChange,
  tipoIntervencao,
  onTipoIntervencaoChange,
  imovelSnapshot,
  onImovelSnapshotChange,
  aiaProfile,
  checklist,
  onChecklistChange,
  linkedArtifacts = {},
  onLinkedArtifactsChange,
  uploadStoragePrefix,
  showMergeTemplate = false,
  readOnly = false,
}: AiaWorkflowPanelProps) {
  const { toast } = useToast();
  const uploadMetaRef = React.useRef({
    prefix: uploadStoragePrefix,
    requestId: requestId ?? "",
    itemId: "",
  });
  const { uploadFile, dialogProps } = useStorageFileUpload({
    storageFolder: "processos",
    storagePathPrefix: `${uploadStoragePrefix}/`,
    buildStoragePath: (_file, safe) => {
      const { prefix, requestId: rid, itemId } = uploadMetaRef.current;
      const base = rid ? `${prefix}/${rid}` : prefix;
      return `${base}/${Date.now()}-${itemId}-${safe}`;
    },
  });
  const [uploadingItemId, setUploadingItemId] = React.useState<string | null>(null);
  const [pendingOnly, setPendingOnly] = React.useState(false);

  const ctx = buildContext(
    interventionSubservices,
    imovelSnapshot,
    tipoIntervencao,
    aiaProfile,
  );

  /** Só re-merge quando regras condicionais mudam (não a cada dígito de área/CAR). */
  const areaOver100 = (imovelSnapshot.areaTotalHa ?? 0) > 100;

  const checklistMergeKey = React.useMemo(
    () =>
      [
        interventionSubservices.join(","),
        tipoIntervencao ?? "",
        aiaProfile?.orgao ?? "",
        aiaProfile?.uf ?? "",
        imovelSnapshot.multiplosProprietarios ? "1" : "0",
        imovelSnapshot.realocacaoRlPrevista ? "1" : "0",
        areaOver100 ? "1" : "0",
      ].join("|"),
    [
      interventionSubservices,
      tipoIntervencao,
      aiaProfile?.orgao,
      aiaProfile?.uf,
      imovelSnapshot.multiplosProprietarios,
      imovelSnapshot.realocacaoRlPrevista,
      areaOver100,
    ],
  );

  const displayChecklist = React.useMemo(
    () =>
      checklist.length === 0
        ? buildInterventionChecklist(ctx)
        : mergeInterventionChecklist(checklist, ctx),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ctx derivado da chave estável
    [checklist, checklistMergeKey],
  );

  const progress = getChecklistProgress(displayChecklist);
  const phases = getChecklistPhases(displayChecklist);
  const globalPct =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  const alerts = collectAiaAlerts({
    services: ["Autorização para Intervenção Ambiental"],
    interventionChecklist: checklist,
    interventionSubservices,
    imovelSnapshot,
    linkedArtifacts,
  } as Pick<
    Request,
    | "services"
    | "interventionChecklist"
    | "interventionSubservices"
    | "imovelSnapshot"
    | "linkedArtifacts"
  >);

  const toggleSub = (id: InterventionSubserviceId) => {
    onSubservicesChange(
      interventionSubservices.includes(id)
        ? interventionSubservices.filter((s) => s !== id)
        : [...interventionSubservices, id],
    );
  };

  const persistChecklist = React.useCallback(
    (next: InterventionChecklistItem[]) => {
      onChecklistChange(next);
    },
    [onChecklistChange],
  );

  const handleMergeTemplate = () => {
    persistChecklist(mergeInterventionChecklist(checklist, ctx));
    toast({
      title: "Checklist atualizado",
      description: "Itens do modelo AIA aplicados; anexos e status preservados quando possível.",
    });
  };

  const updateItemStatus = (
    itemId: string,
    status: InterventionChecklistItem["status"],
  ) => {
    persistChecklist(
      displayChecklist.map((item) =>
        item.id === itemId ? { ...item, status } : item,
      ),
    );
  };

  const handleFileUpload = async (
    itemId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    inputEl.value = "";
    if (!file) return;
    const allowedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "webp"];
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExtensions.includes(extension)) {
      toast({
        variant: "destructive",
        title: "Formato não permitido",
        description: "Use PDF, Word, Excel ou imagem (JPG/PNG/WEBP).",
      });
      return;
    }
    try {
      setUploadingItemId(itemId);
      uploadMetaRef.current = {
        prefix: uploadStoragePrefix,
        requestId: requestId ?? "",
        itemId,
      };
      const url = await uploadFile(file);
      if (!url) return;
      persistChecklist(
        displayChecklist.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: item.status === "not_started" ? "collecting" : item.status,
                attachments: [
                  ...item.attachments,
                  { name: file.name, url, uploadedAt: new Date().toISOString() },
                ],
              }
            : item,
        ),
      );
      toast({ title: "Arquivo anexado" });
    } catch {
      toast({
        variant: "destructive",
        title: "Falha no upload",
        description: "Não foi possível anexar o arquivo.",
      });
    } finally {
      setUploadingItemId(null);
    }
  };

  const linkParams = {
    requestId,
    projectId,
    empreendedorId,
    linked: linkedArtifacts,
  };

  const filteredPhases = phases.map((phase) => {
    const items = displayChecklist.filter((i) => {
      if (i.phase !== phase) return false;
      if (!pendingOnly) return true;
      return (
        i.status !== "completed" &&
        i.status !== "not_applicable"
      );
    });
    return { phase, items };
  }).filter((p) => p.items.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Dados do trâmite AIA</CardTitle>
          <CardDescription>
            Perfil {aiaProfile?.orgao ?? DEFAULT_AIA_PROFILE.orgao} —{" "}
            {aiaProfile?.uf ?? DEFAULT_AIA_PROFILE.uf}. Ajuste o imóvel para regras condicionais do checklist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Área total da intervenção (ha)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                disabled={readOnly}
                value={imovelSnapshot.areaTotalHa ?? ""}
                onChange={(e) =>
                  onImovelSnapshotChange({
                    ...imovelSnapshot,
                    areaTotalHa: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Código / recibo CAR</Label>
              <Input
                disabled={readOnly}
                value={imovelSnapshot.codigoCar ?? ""}
                onChange={(e) =>
                  onImovelSnapshotChange({
                    ...imovelSnapshot,
                    codigoCar: e.target.value || undefined,
                  })
                }
                placeholder="BR-..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de intervenção</Label>
              <Select
                value={tipoIntervencao ?? ""}
                disabled={readOnly}
                onValueChange={(v) =>
                  onTipoIntervencaoChange(
                    v ? (v as TipoIntervencaoAia) : undefined,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_INTERVENCAO_AIA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox
                id="aia-multiplos-prop"
                disabled={readOnly}
                checked={imovelSnapshot.multiplosProprietarios === true}
                onCheckedChange={(c) =>
                  onImovelSnapshotChange({
                    ...imovelSnapshot,
                    multiplosProprietarios: c === true,
                  })
                }
              />
              <Label htmlFor="aia-multiplos-prop" className="font-normal cursor-pointer">
                Mais de um proprietário (carta de anuência)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="aia-realoc-rl"
                disabled={readOnly}
                checked={imovelSnapshot.realocacaoRlPrevista === true}
                onCheckedChange={(c) =>
                  onImovelSnapshotChange({
                    ...imovelSnapshot,
                    realocacaoRlPrevista: c === true,
                  })
                }
              />
              <Label htmlFor="aia-realoc-rl" className="font-normal cursor-pointer">
                Prevista realocação de Reserva Legal
              </Label>
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <Label>Subserviços</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {INTERVENTION_SUBSERVICES.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`aia-panel-sub-${sub.id}`}
                    disabled={readOnly}
                    checked={interventionSubservices.includes(sub.id)}
                    onCheckedChange={() => toggleSub(sub.id)}
                  />
                  <Label
                    htmlFor={`aia-panel-sub-${sub.id}`}
                    className="font-normal cursor-pointer"
                  >
                    {sub.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Alert
              key={a.id}
              variant={a.severity === "error" ? "destructive" : "default"}
            >
              <AlertTitle>
                {a.severity === "warning" ? "Atenção" : "Informação"}
              </AlertTitle>
              <AlertDescription>{a.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Fluxo AIA — 7 fases</CardTitle>
              <CardDescription>
                Obrigatórios: {progress.requiredDone}/{progress.required} · Geral:{" "}
                {progress.completed}/{progress.total}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {showMergeTemplate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMergeTemplate}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Atualizar modelo AIA
                </Button>
              )}
              <Button
                type="button"
                variant={pendingOnly ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPendingOnly((p) => !p)}
              >
                {pendingOnly ? "Ver todos" : "Só pendentes"}
              </Button>
            </div>
          </div>
          <Progress value={globalPct} className="mt-3 h-2" />
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {IEF_INTERVENTION_REFERENCE_DOCS.map((doc) => (
              <Button key={doc.url} variant="outline" size="sm" asChild>
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  {doc.title}
                </a>
              </Button>
            ))}
          </div>
          <Accordion type="multiple" className="w-full" defaultValue={[phases[0] ?? ""]}>
            {filteredPhases.map(({ phase, items }) => {
              const phaseProg = progress.byPhase[phase];
              const phasePct =
                phaseProg && phaseProg.total > 0
                  ? Math.round((phaseProg.done / phaseProg.total) * 100)
                  : 0;
              return (
                <AccordionItem key={phase} value={phase}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center justify-between gap-2 pr-2 text-left">
                      <span className="text-sm font-medium">{phase}</span>
                      <Badge variant="outline" className="shrink-0">
                        {phaseProg?.done ?? 0}/{phaseProg?.total ?? 0}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Progress value={phasePct} className="mb-3 h-1" />
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-md border p-3 space-y-2"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-2 min-w-0">
                              <Checkbox
                                id={item.id}
                                disabled={readOnly}
                                checked={item.status === "completed"}
                                onCheckedChange={(checked) =>
                                  updateItemStatus(
                                    item.id,
                                    checked ? "completed" : "not_started",
                                  )
                                }
                              />
                              <div className="grid gap-1 min-w-0">
                                <Label htmlFor={item.id} className="font-normal leading-snug">
                                  {item.title}
                                </Label>
                                {item.note && (
                                  <p className="text-xs text-muted-foreground">{item.note}</p>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  {item.required && (
                                    <Badge variant="outline">Obrigatório</Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={cn(getChecklistStatusBadgeClass(item.status))}
                                  >
                                    {getChecklistStatusLabel(item.status)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 shrink-0">
                              {item.linkType === "internal_route" && item.linkKey && (
                                <Button type="button" variant="secondary" size="sm" asChild>
                                  <Link
                                    href={buildAiaModuleHref(item.linkKey, linkParams)}
                                  >
                                    Abrir
                                  </Link>
                                </Button>
                              )}
                              {item.linkType === "external" && item.externalUrl && (
                                <Button type="button" variant="outline" size="sm" asChild>
                                  <a
                                    href={item.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                    Site
                                  </a>
                                </Button>
                              )}
                              {(item.linkType === "upload" || !item.linkType) && !readOnly && (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={uploadingItemId === item.id}
                                    onClick={() =>
                                      document
                                        .getElementById(`file-${item.id}`)
                                        ?.click()
                                    }
                                  >
                                    {uploadingItemId === item.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Upload className="mr-1 h-3.5 w-3.5" />
                                        Anexar
                                      </>
                                    )}
                                  </Button>
                                  <input
                                    id={`file-${item.id}`}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                                    onChange={(e) => handleFileUpload(item.id, e)}
                                  />
                                </>
                              )}
                              {!readOnly && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateItemStatus(item.id, "not_applicable")
                                }
                              >
                                N/A
                              </Button>
                              )}
                            </div>
                          </div>
                          {item.attachments.length > 0 && (
                            <ul className="text-xs text-muted-foreground space-y-1 pl-6">
                              {item.attachments.map((att, idx) => (
                                <li key={`${att.url}-${idx}`}>
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-foreground"
                                  >
                                    {att.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {onLinkedArtifactsChange && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vínculos com estudos</CardTitle>
            <CardDescription>
              IDs dos documentos gerados em outros módulos (opcional; também preenchido ao criar PIA com requestId).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["piaId", "PIA"],
                ["inventoryId", "Inventário"],
                ["mapJobId", "Job mapas"],
                ["georefProjectId", "Georreferenciamento"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  value={linkedArtifacts[key] ?? ""}
                  onChange={(e) =>
                    onLinkedArtifactsChange({
                      ...linkedArtifacts,
                      [key]: e.target.value || undefined,
                    })
                  }
                  placeholder="ID do documento"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <UploadPreparationDialog {...dialogProps} />
    </div>
  );
}

/** Sincroniza checklist só quando subserviços mudam (evita loop ao digitar área/CAR). */
export function useAiaChecklistSubserviceSync(
  enabled: boolean,
  checklist: InterventionChecklistItem[],
  onChecklistChange: (items: InterventionChecklistItem[]) => void,
  ctx: Partial<AiaChecklistContext>,
) {
  const subsKey = (ctx.subservices ?? []).join(",");
  React.useEffect(() => {
    if (!enabled) return;
    if (checklist.length === 0) {
      onChecklistChange(buildInterventionChecklist(ctx));
      return;
    }
    onChecklistChange(mergeInterventionChecklist(checklist, ctx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, subsKey]);
}

export function applyImovelFromProject(
  project: Project | null | undefined,
  current: AiaImovelSnapshot,
): AiaImovelSnapshot {
  if (!project) return current;
  const owners = project.ownerCondition ?? [];
  return {
    ...current,
    areaTotalHa: current.areaTotalHa ?? project.projectArea?.totalArea,
    codigoCar: current.codigoCar ?? project.car?.receiptNumber,
    multiplosProprietarios:
      current.multiplosProprietarios ?? owners.length > 1,
  };
}
