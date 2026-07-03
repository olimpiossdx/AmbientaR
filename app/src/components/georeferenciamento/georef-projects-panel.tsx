"use client";

import * as React from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { useFirebase, useAuth } from "@/firebase";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GeorefProject, GeorefStatus, GeorefTipo } from "@/lib/georeferenciamento/types";
import {
  GEOREF_STATUS_LABELS,
  GEOREF_TIPO_LABELS,
} from "@/lib/georeferenciamento/types";
import { mapGeorefProjectDoc } from "@/lib/georeferenciamento/map-doc";
import {
  clearGeorefLocalizadorDrafts,
  readGeorefLocalizadorDraft,
  GEOREF_CAR_DRAFT_KEY,
  GEOREF_CAMPO_DRAFT_KEY,
  type GeorefLocalizadorDraft,
} from "@/lib/geospatial/localizacao-request-snapshot";
import { GeorefClientProjectFields } from "@/components/georeferenciamento/georef-client-project-fields";
import {
  projectToGeorefFields,
  useGeorefClientProject,
} from "@/hooks/use-georef-client-project";

export function GeorefProjectsPanel() {
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = React.useState<GeorefProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [tipo, setTipo] = React.useState<GeorefTipo>("rural");
  const [municipio, setMunicipio] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [localizadorDraft, setLocalizadorDraft] =
    React.useState<GeorefLocalizadorDraft | null>(null);

  const { selectedClient, selectedProject } = useGeorefClientProject(clientId, projectId);

  React.useEffect(() => {
    if (!open) {
      setLocalizadorDraft(null);
      return;
    }
    const carDraft = readGeorefLocalizadorDraft(GEOREF_CAR_DRAFT_KEY);
    const campoDraft = readGeorefLocalizadorDraft(GEOREF_CAMPO_DRAFT_KEY);
    const draft = carDraft ?? campoDraft;
    if (!draft) return;
    setLocalizadorDraft(draft);
    if (carDraft) setTipo("ambiental");
    else if (campoDraft) setTipo("rural");
    if (draft.municipio) setMunicipio(draft.municipio);
    if (!title.trim()) {
      const label = draft.municipio
        ? `${draft.municipio}${draft.uf ? `/${draft.uf}` : ""}`
        : draft.car ?? "Imóvel";
      setTitle(carDraft ? `CAR — ${label}` : `Campo — ${label}`);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- preenche só ao abrir dialog

  React.useEffect(() => {
    if (!selectedProject) return;
    const fields = projectToGeorefFields(selectedProject);
    if (!title.trim() && fields.title) setTitle(fields.title);
    if (!municipio.trim() && fields.municipio) setMunicipio(fields.municipio);
  }, [selectedProject, title, municipio]);

  React.useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, "georef_projects"),
      orderBy("updatedAt", "desc"),
      limit(200),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => mapGeorefProjectDoc(d.id, d.data() as Record<string, unknown>)));
        setLoading(false);
      },
      (err) => {
        console.error("georef_projects:", err);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Não foi possível carregar trâmites",
          description:
            "Verifique permissões (perfil técnico/admin) ou execute npm run deploy:rules.",
        });
      },
    );
    return () => unsub();
  }, [firestore, toast]);

  const createProject = async () => {
    if (!firestore || !user?.id || !title.trim()) {
      toast({ title: "Informe o título do processo.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const pf = selectedProject ? projectToGeorefFields(selectedProject) : null;
    const draft = localizadorDraft;
    try {
      await addDoc(collection(firestore, "georef_projects"), {
        title: title.trim(),
        tipo,
        status: "prospeccao",
        clientId: clientId || null,
        clientName: selectedClient?.name ?? null,
        projectId: projectId || null,
        projectName: pf?.projectName ?? null,
        municipio: municipio.trim() || draft?.municipio || pf?.municipio || null,
        uf: draft?.uf ?? pf?.uf ?? "MG",
        matricula: pf?.matricula ?? null,
        car: draft?.car ?? pf?.car ?? null,
        areaHa: draft?.areaHa ?? null,
        polygonGeojson: draft?.polygonGeojson ?? null,
        localizacaoImovel: draft?.localizacaoImovel ?? null,
        checklist: {},
        vertices: [],
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
      });
      clearGeorefLocalizadorDrafts();
      toast({ title: "Processo de georreferenciamento criado." });
      setOpen(false);
      setTitle("");
      setMunicipio("");
      setClientId("");
      setProjectId("");
      setLocalizadorDraft(null);
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const advanceStatus = async (p: GeorefProject) => {
    if (!firestore) return;
    const order: GeorefStatus[] = [
      "prospeccao",
      "contratacao",
      "campo",
      "processamento",
      "documentacao",
      "certificacao_sigef",
      "validacao_car",
      "registro_cartorio",
      "concluido",
    ];
    const idx = order.indexOf(p.status);
    const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : p.status;
    try {
      await updateDoc(doc(firestore, "georef_projects", p.id), {
        status: next,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast({
        title: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Processos de georreferenciamento">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Novo trâmite fundiário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo trâmite fundiário</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <GeorefClientProjectFields
                clientId={clientId}
                projectId={projectId}
                onClientIdChange={setClientId}
                onProjectIdChange={setProjectId}
              />
              <div className="grid gap-2">
                <Label htmlFor="georef-title">Título / imóvel</Label>
                <Input
                  id="georef-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Fazenda Exemplo — certificação SIGEF"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as GeorefTipo)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(GEOREF_TIPO_LABELS) as GeorefTipo[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {GEOREF_TIPO_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="georef-mun">Município</Label>
                <Input
                  id="georef-mun"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  placeholder="Ex.: Belo Horizonte"
                />
              </div>
              {localizadorDraft ? (
                <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  Rascunho SICAR/campo carregado: CAR{" "}
                  <span className="font-mono">{localizadorDraft.car ?? "—"}</span>
                  {localizadorDraft.areaHa != null
                    ? ` · ${localizadorDraft.areaHa.toFixed(2)} ha`
                    : null}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => void createProject()} disabled={saving}>
                {saving ? "Salvando…" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Processo</TableHead>
              <TableHead className="hidden lg:table-cell">Cliente / empreendimento</TableHead>
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum processo cadastrado. Crie o primeiro para acompanhar etapas e checklists.
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.title}</p>
                    {p.municipio ? (
                      <p className="text-xs text-muted-foreground">{p.municipio}</p>
                    ) : null}
                    {p.vertices?.length ? (
                      <p className="text-xs text-muted-foreground">{p.vertices.length} vértices</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {p.clientName ?? "—"}
                    {p.projectName ? (
                      <>
                        <br />
                        <span className="text-foreground">{p.projectName}</span>
                      </>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {GEOREF_TIPO_LABELS[p.tipo]}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{GEOREF_STATUS_LABELS[p.status]}</Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/georeferenciamento/processos/${p.id}`}>Abrir</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void advanceStatus(p)}>
                      Avançar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
