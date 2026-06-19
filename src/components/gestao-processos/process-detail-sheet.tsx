"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ConsultoriaProject,
  OfficeProcess,
  OfficeProcessEvent,
  OfficeProcessEventTipo,
  OfficeProcessFase,
  OfficeProcessPrioridade,
} from "@/lib/gestao-processos/types";
import {
  OFFICE_PROCESS_FASE_LABELS,
  formatPrazoDisplay,
} from "@/lib/gestao-processos/utils";
import {
  etapaLabel,
  resolveProcessPipelineState,
} from "@/lib/gestao-processos/pipeline-utils";
import { LICENCIAMENTO_REQUESTS_PATH } from "@/lib/licenciamento-menu";
import { gestaoProcessosProjetoDetailPath } from "@/lib/gestao-processos-menu";
import { consultoriaProjectLabel } from "@/lib/gestao-processos/consultoria-project-utils";
import { linkProcessToConsultoriaProject } from "@/lib/gestao-processos/office-process-import";
import { OFFICE_PROCESS_PRIORIDADE_LABELS } from "@/components/gestao-processos/process-form-dialog";
import { ProcessAlertsBadges } from "@/components/gestao-processos/process-alerts-badges";
import { ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const EVENT_TIPO_LABELS: Record<OfficeProcessEventTipo, string> = {
  solicitacao: "Solicitação",
  recebimento: "Recebimento",
  atendimento: "Atendimento",
  nota: "Nota",
  mudanca_status: "Mudança de status",
};

const EVENT_TAB_TIPOS: Record<string, OfficeProcessEventTipo[]> = {
  solicitacoes: ["solicitacao"],
  recebimentos: ["recebimento"],
  atendimentos: ["atendimento"],
  timeline: [
    "solicitacao",
    "recebimento",
    "atendimento",
    "nota",
    "mudanca_status",
  ],
};

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm whitespace-pre-wrap">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

function formatEventDate(value: unknown): string {
  if (!value) return "—";
  try {
    const date =
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate: () => Date }).toDate === "function"
        ? (value as { toDate: () => Date }).toDate()
        : new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("pt-BR");
    }
  } catch {
    /* ignore */
  }
  return "—";
}

type ProcessDetailSheetProps = {
  process: OfficeProcess | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
  consultoriaProjects?: ConsultoriaProject[];
};

export function ProcessDetailSheet({
  process,
  open,
  onOpenChange,
  canWrite,
  consultoriaProjects = [],
}: ProcessDetailSheetProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [eventTipo, setEventTipo] = React.useState<OfficeProcessEventTipo>("nota");
  const [eventTitulo, setEventTitulo] = React.useState("");
  const [eventDescricao, setEventDescricao] = React.useState("");
  const [savingEvent, setSavingEvent] = React.useState(false);
  const [linkProjectId, setLinkProjectId] = React.useState<string>("");
  const [prioridade, setPrioridade] = React.useState<OfficeProcessPrioridade | "">("");
  const [savingLink, setSavingLink] = React.useState(false);
  const [savingPrioridade, setSavingPrioridade] = React.useState(false);

  React.useEffect(() => {
    setLinkProjectId(process?.consultoriaProjectId ?? "");
    setPrioridade(process?.prioridade ?? "");
  }, [process?.consultoriaProjectId, process?.prioridade, process?.id]);

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore || !process?.id) return null;
    return collection(firestore, "officeProcesses", process.id, "events");
  }, [firestore, process?.id]);

  const { data: events, isLoading: eventsLoading } =
    useCollection<OfficeProcessEvent>(eventsQuery);

  const sortedEvents = React.useMemo(
    () =>
      [...(events ?? [])].sort((a, b) => {
        const ta = formatEventDate(a.data ?? a.createdAt);
        const tb = formatEventDate(b.data ?? b.createdAt);
        return tb.localeCompare(ta, "pt-BR");
      }),
    [events],
  );

  const handleAddEvent = async (tipo: OfficeProcessEventTipo) => {
    if (!firestore || !process || !eventTitulo.trim()) return;
    setSavingEvent(true);
    try {
      await addDoc(
        collection(firestore, "officeProcesses", process.id, "events"),
        {
          tipo,
          titulo: eventTitulo.trim(),
          descricao: eventDescricao.trim() || undefined,
          data: serverTimestamp(),
          autorUid: user?.uid,
          autorName: user?.displayName || user?.name || user?.email,
          createdAt: serverTimestamp(),
        },
      );
      setEventTitulo("");
      setEventDescricao("");
      toast({ title: "Registro adicionado" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: (e as Error).message,
      });
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!firestore || !process) return;
    try {
      await deleteDoc(
        doc(firestore, "officeProcesses", process.id, "events", eventId),
      );
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: (e as Error).message,
      });
    }
  };

  const handleSaveProjectLink = async () => {
    if (!firestore || !process) return;
    setSavingLink(true);
    try {
      await linkProcessToConsultoriaProject(
        firestore,
        process.id,
        linkProjectId || null,
      );
      toast({
        title: linkProjectId ? "Projeto vinculado" : "Vínculo removido",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao vincular",
        description: (e as Error).message,
      });
    } finally {
      setSavingLink(false);
    }
  };

  const handleSavePrioridade = async () => {
    if (!firestore || !process) return;
    setSavingPrioridade(true);
    try {
      await updateDoc(doc(firestore, "officeProcesses", process.id), {
        prioridade: prioridade ? prioridade : deleteField(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Prioridade atualizada" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: (e as Error).message,
      });
    } finally {
      setSavingPrioridade(false);
    }
  };

  const renderEventList = (tipos: OfficeProcessEventTipo[]) => {
    const filtered = sortedEvents.filter((e) => tipos.includes(e.tipo));
    if (eventsLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando…
        </div>
      );
    }
    if (!filtered.length) {
      return (
        <p className="text-sm text-muted-foreground">
          Nenhum registro nesta aba.
        </p>
      );
    }
    return (
      <ul className="space-y-3">
        {filtered.map((ev) => (
          <li
            key={ev.id}
            className="rounded-lg border border-border/80 bg-muted/20 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{ev.titulo}</span>
                  <Badge variant="outline" className="text-xs">
                    {EVENT_TIPO_LABELS[ev.tipo]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatEventDate(ev.data ?? ev.createdAt)}
                  {ev.autorName ? ` · ${ev.autorName}` : ""}
                </p>
                {ev.descricao ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {ev.descricao}
                  </p>
                ) : null}
              </div>
              {canWrite ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteEvent(ev.id)}
                  aria-label="Remover registro"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  if (!process) return null;

  const pipelineState = resolveProcessPipelineState(process);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden sm:max-w-xl md:max-w-2xl"
      >
        <SheetHeader className="shrink-0 text-left">
          <SheetTitle className="font-mono text-base leading-snug">
            {process.numeroProcesso}
          </SheetTitle>
          <SheetDescription>
            {process.tipoProcesso.toUpperCase()} ·{" "}
            {OFFICE_PROCESS_FASE_LABELS[process.fase as OfficeProcessFase]}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="resumo" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full shrink-0 grid-cols-5">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
            <TabsTrigger value="recebimentos">Recebimentos</TabsTrigger>
            <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
            <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto py-4">
            <TabsContent value="resumo" className="mt-0 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {process.tipoProcesso.toUpperCase()}
                </Badge>
                <Badge
                  className={cn(
                    process.fase === "concluido" &&
                      "bg-emerald-500/15 text-emerald-700",
                    process.fase === "em_analise" &&
                      "bg-blue-500/15 text-blue-800",
                    process.fase === "exigencia" &&
                      "bg-amber-500/15 text-amber-800",
                  )}
                >
                  {OFFICE_PROCESS_FASE_LABELS[process.fase]}
                </Badge>
                {process.statusDetalhe ? (
                  <Badge variant="secondary">{process.statusDetalhe}</Badge>
                ) : null}
                {process.seedValidation ? (
                  <Badge variant="outline" className="border-dashed">
                    Dados de validação
                  </Badge>
                ) : null}
                {process.prioridade === "alta" ? (
                  <Badge variant="destructive">Prioridade alta</Badge>
                ) : null}
              </div>
              <ProcessAlertsBadges process={process} />

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField
                  label="Pipeline"
                  value={
                    pipelineState.pipeline === "consultoria"
                      ? "Consultoria (pré-protocolo)"
                      : pipelineState.pipeline === "orgao"
                        ? "Órgão (pós-protocolo)"
                        : "Encerrado"
                  }
                />
                <DetailField
                  label="Etapa no kanban"
                  value={etapaLabel(pipelineState.pipeline, pipelineState.etapa)}
                />
                <DetailField label="Empreendedor" value={process.empreendedorName} />
                <DetailField label="Empreendimento" value={process.empreendimentoName} />
                <DetailField label="Município" value={process.municipio} />
                <DetailField label="Tipo de intervenção" value={process.tipoIntervencao} />
                <DetailField label="Prazo" value={formatPrazoDisplay(process.prazo)} />
                <DetailField label="Órgão" value={process.orgao} />
                <DetailField label="Responsável" value={process.responsavelName} />
                <DetailField label="Observações" value={process.observacoes} />
              </div>

              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Prioridade</Label>
                {canWrite ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={prioridade || "__none__"}
                      onValueChange={(v) =>
                        setPrioridade(
                          v === "__none__" ? "" : (v as OfficeProcessPrioridade),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sem prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem prioridade</SelectItem>
                        {(
                          Object.entries(OFFICE_PROCESS_PRIORIDADE_LABELS) as [
                            OfficeProcessPrioridade,
                            string,
                          ][]
                        ).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      disabled={savingPrioridade}
                      onClick={() => void handleSavePrioridade()}
                    >
                      {savingPrioridade ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Salvar"
                      )}
                    </Button>
                  </div>
                ) : process.prioridade ? (
                  <p className="text-sm">
                    {OFFICE_PROCESS_PRIORIDADE_LABELS[process.prioridade]}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>

              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Projeto de consultoria
                </Label>
                {canWrite ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={linkProjectId || "__none__"}
                      onValueChange={(v) =>
                        setLinkProjectId(v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sem projeto vinculado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem projeto</SelectItem>
                        {[...consultoriaProjects]
                          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.code ? `${p.code} — ${p.name}` : p.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      disabled={savingLink}
                      onClick={() => void handleSaveProjectLink()}
                    >
                      {savingLink ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Salvar vínculo"
                      )}
                    </Button>
                  </div>
                ) : process.consultoriaProjectId ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={gestaoProcessosProjetoDetailPath(process.consultoriaProjectId)}>
                      {consultoriaProjectLabel(
                        process.consultoriaProjectId,
                        consultoriaProjects,
                      ) ?? "Ver projeto"}
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>

              {process.requestId ? (
                <>
                  <Separator />
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`${LICENCIAMENTO_REQUESTS_PATH}/${process.requestId}/edit`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir trâmite de Licenciamento
                    </Link>
                  </Button>
                </>
              ) : null}
            </TabsContent>

            {(["solicitacoes", "recebimentos", "atendimentos", "timeline"] as const).map(
              (tab) => (
                <TabsContent key={tab} value={tab} className="mt-0 space-y-4">
                  {canWrite && tab !== "timeline" ? (
                    <div className="space-y-2 rounded-lg border border-dashed p-3">
                      <Label className="text-xs">Novo registro</Label>
                      <Input
                        placeholder="Título"
                        value={eventTitulo}
                        onChange={(e) => setEventTitulo(e.target.value)}
                      />
                      <Textarea
                        placeholder="Descrição (opcional)"
                        value={eventDescricao}
                        onChange={(e) => setEventDescricao(e.target.value)}
                        rows={2}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingEvent || !eventTitulo.trim()}
                        onClick={() =>
                          handleAddEvent(
                            tab === "solicitacoes"
                              ? "solicitacao"
                              : tab === "recebimentos"
                                ? "recebimento"
                                : "atendimento",
                          )
                        }
                      >
                        {savingEvent ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Adicionar
                      </Button>
                    </div>
                  ) : null}
                  {canWrite && tab === "timeline" ? (
                    <div className="space-y-2 rounded-lg border border-dashed p-3">
                      <Label className="text-xs">Nova nota na linha do tempo</Label>
                      <div className="flex flex-wrap gap-2">
                        <Select
                          value={eventTipo}
                          onValueChange={(v) =>
                            setEventTipo(v as OfficeProcessEventTipo)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(EVENT_TIPO_LABELS) as OfficeProcessEventTipo[]).map(
                              (t) => (
                                <SelectItem key={t} value={t}>
                                  {EVENT_TIPO_LABELS[t]}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder="Título"
                        value={eventTitulo}
                        onChange={(e) => setEventTitulo(e.target.value)}
                      />
                      <Textarea
                        placeholder="Descrição (opcional)"
                        value={eventDescricao}
                        onChange={(e) => setEventDescricao(e.target.value)}
                        rows={2}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingEvent || !eventTitulo.trim()}
                        onClick={() => handleAddEvent(eventTipo)}
                      >
                        {savingEvent ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Adicionar à linha do tempo
                      </Button>
                    </div>
                  ) : null}
                  {renderEventList(EVENT_TAB_TIPOS[tab])}
                </TabsContent>
              ),
            )}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
