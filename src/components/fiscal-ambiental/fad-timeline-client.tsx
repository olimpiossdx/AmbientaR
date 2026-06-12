"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, Loader2, Satellite, StickyNote, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";
import {
  createTimelineNote,
  deleteTimelineNote,
  listFadWorkspaces,
  listTimeline,
  type FadTimelineEventDto,
} from "@/lib/fiscal-ambiental/fad-api-client";
import type { FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function FadTimelineClient() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [events, setEvents] = React.useState<FadTimelineEventDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [noteTitle, setNoteTitle] = React.useState("");
  const [noteBody, setNoteBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await getFadAuthToken();
        const res = await listFadWorkspaces(token);
        if (res.ok && res.data.length) {
          setWorkspaces(res.data);
          setWorkspaceId(res.data[0]!.id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadTimeline = React.useCallback(async (wsId: string) => {
    const token = await getFadAuthToken();
    const res = await listTimeline(token, wsId);
    if (res.ok) setEvents(res.data);
  }, []);

  React.useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    loadTimeline(workspaceId).finally(() => setLoading(false));
  }, [workspaceId, loadTimeline]);

  const handleAddNote = async () => {
    if (!noteTitle.trim() || !workspaceId) return;
    setSaving(true);
    try {
      const token = await getFadAuthToken();
      const res = await createTimelineNote(token, workspaceId, {
        title: noteTitle.trim(),
        body: noteBody.trim() || undefined,
      });
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: res.error });
        return;
      }
      setNoteTitle("");
      setNoteBody("");
      await loadTimeline(workspaceId);
      toast({ title: "Nota adicionada à linha do tempo." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (eventId: string) => {
    if (eventId.startsWith("mosaic_")) return;
    const token = await getFadAuthToken();
    const res = await deleteTimelineNote(token, workspaceId, eventId);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erro", description: res.error });
      return;
    }
    await loadTimeline(workspaceId);
  };

  if (loading && !workspaces.length) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Linha do tempo ambiental</h1>
          <p className="text-sm text-muted-foreground">
            Histórico cronológico do acervo e notas do imóvel.
          </p>
        </div>
        <div className="space-y-1">
          <Label>Imóvel</Label>
          <Select value={workspaceId} onValueChange={setWorkspaceId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Adicionar nota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Título da nota"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <Textarea
            placeholder="Detalhes (opcional)"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={2}
          />
          <Button onClick={handleAddNote} disabled={saving || !noteTitle.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar nota
          </Button>
        </CardContent>
      </Card>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum evento ainda.{" "}
          <Link href={`${FAD_ROUTE_BASE}/montar-acervo`} className="text-primary underline">
            Montar acervo
          </Link>
        </p>
      ) : (
        <ol className="relative space-y-0 border-l border-border pl-6">
          {events.map((ev, i) => {
            const isMosaic = ev.kind === "satellite_mosaic_created";
            const isSynthetic = ev.id.startsWith("mosaic_");
            return (
              <li key={ev.id} className={cn("relative pb-8", i === events.length - 1 && "pb-0")}>
                <span
                  className={cn(
                    "absolute -left-[1.65rem] flex h-7 w-7 items-center justify-center rounded-full border bg-background",
                    isMosaic ? "text-sky-600" : "text-amber-600",
                  )}
                >
                  {isMosaic ? <Satellite className="h-3.5 w-3.5" /> : <StickyNote className="h-3.5 w-3.5" />}
                </span>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{ev.title}</p>
                    {ev.body ? (
                      <p className="mt-1 text-sm text-muted-foreground">{ev.body}</p>
                    ) : null}
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(ev.occurredAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {ev.mosaicId ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`${FAD_ROUTE_BASE}/comparador?workspace=${workspaceId}&mosaic=${ev.mosaicId}`}
                        >
                          Comparar
                        </Link>
                      </Button>
                    ) : null}
                    {ev.kind === "manual_note" && !isSynthetic ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => handleDeleteNote(ev.id)}
                        aria-label="Remover nota"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
