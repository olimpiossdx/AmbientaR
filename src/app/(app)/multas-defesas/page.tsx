"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Clock, MessageSquare, ChevronRight, Trash2 } from "lucide-react";
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
import { CardSearchInput } from "@/components/card-search-input";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { canManageAutoInfracaoDefesa } from "@/lib/role-guards";
import {
  MULTAS_DEFESAS_NOVA_PATH,
  multasDefesasTramitePath,
} from "@/lib/multas-defesas-menu";
import { collection, deleteDoc, doc } from "firebase/firestore";
import type { Empreendedor, Project } from "@/lib/types";
import {
  DECISAO_ENCERRAMENTO_LABELS,
  MULTAS_E_DEFESAS_MENU_LABEL,
  MULTA_STATUS_LABELS,
  PRAZO_DEFESA_1_INSTANCIA_DIAS,
  type MultaDefesaFluxo,
  diasCorridosRestantesDefesa,
  formatPrazoDefesaLabel,
  inferMultaStatus,
  isMultaComPrazoEmAberto,
} from "@/lib/multas-defesas";
import type { AutoInfracaoDefesaRecord } from "@/lib/multas-defesas/types";
import {
  getDefesaMotivosLinha,
  getDefesaResumoText,
  getDefesaSinteseAuto,
} from "@/lib/multas-defesas/card-helpers";

type AutoInfracaoDefesa = MultaDefesaFluxo & AutoInfracaoDefesaRecord;

export default function MultasDefesasPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const canWriteDefesa = canManageAutoInfracaoDefesa(user?.role);

  const [deleteTarget, setDeleteTarget] = React.useState<AutoInfracaoDefesa | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const defesasQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "autoInfracaoDefesas") : null),
    [firestore],
  );
  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );

  const { data: defesas, isLoading } = useCollection<AutoInfracaoDefesa>(defesasQuery);
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const { data: projects } = useCollection<Project>(projectsQuery);

  const empreendedorNameMap = React.useMemo(
    () => new Map((empreendedores || []).map((e) => [e.id, e.name])),
    [empreendedores],
  );
  const projectNameMap = React.useMemo(
    () => new Map((projects || []).map((p) => [p.id, p.propertyName])),
    [projects],
  );

  const filteredDefesas = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = (defesas || []).filter((item) => {
      if (!term) return true;
      const empreendedor = (empreendedorNameMap.get(item.empreendedorId) || "").toLowerCase();
      const empreendimento = (projectNameMap.get(item.projectId) || "").toLowerCase();
      const c = item.defesaConteudo || {};
      const conteudoBusca = [
        c.autoNumero,
        c.autoCodigo,
        c.autoRelatoFiscal,
        c.sinteseAuto,
        c.referenciaAutoProcesso,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        item.processNumber.toLowerCase().includes(term) ||
        (item.tipoDefesa || "").toLowerCase().includes(term) ||
        (item.informacoesInternas || "").toLowerCase().includes(term) ||
        conteudoBusca.includes(term) ||
        empreendedor.includes(term) ||
        empreendimento.includes(term)
      );
    });
    return [...base].sort((a, b) =>
      (a.processNumber || "").localeCompare(b.processNumber || "", "pt-BR", {
        sensitivity: "base",
      }),
    );
  }, [defesas, empreendedorNameMap, projectNameMap, searchTerm]);

  const resumoPrazos = React.useMemo(() => {
    const items = defesas || [];
    let prazoAberto = 0;
    let demandasPendentes = 0;
    let aguardandoOpcao = 0;
    for (const item of items) {
      const st = inferMultaStatus(item);
      if (st === "demanda_defesa_pendente") demandasPendentes += 1;
      if (st === "aguardando_opcao") aguardandoOpcao += 1;
      if (isMultaComPrazoEmAberto(item)) prazoAberto += 1;
    }
    return { prazoAberto, demandasPendentes, aguardandoOpcao, total: items.length };
  }, [defesas]);

  const confirmDelete = async () => {
    if (!firestore || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(firestore, "autoInfracaoDefesas", deleteTarget.id));
      toast({ title: "Processo excluído" });
      setDeleteTarget(null);
    } catch {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={MULTAS_E_DEFESAS_MENU_LABEL}>
        <Button size="sm" className="gap-1" asChild>
          <Link href={MULTAS_DEFESAS_NOVA_PATH}>
            <PlusCircle className="h-4 w-4" />
            Nova multa
          </Link>
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Prazo em aberto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resumoPrazos.prazoAberto}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Até {PRAZO_DEFESA_1_INSTANCIA_DIAS} dias corridos após a cientificação
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Demandas de defesa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resumoPrazos.demandasPendentes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aguardando opção</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resumoPrazos.aguardandoOpcao}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Multas e processos de defesa</CardTitle>
            <CardDescription>
              Abra o trâmite para anexar documentos, elaborar a petição e registrar o protocolo.
            </CardDescription>
            <CardSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar processo, empreendedor, empreendimento..."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            {!isLoading && filteredDefesas.length === 0 && (
              <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed text-center text-sm text-muted-foreground">
                Nenhuma multa registrada. Use &quot;Nova multa&quot; para começar.
              </div>
            )}
            {!isLoading &&
              filteredDefesas.map((item) => {
                const autoNumero = (item.defesaConteudo?.autoNumero || "").trim();
                const tituloCard = autoNumero
                  ? `${item.processNumber} · Auto ${autoNumero}`
                  : item.processNumber;
                const status = inferMultaStatus(item);
                const prazoLabel = formatPrazoDefesaLabel(
                  item.dataCientificacao,
                  item.prazoDefesaDias ?? PRAZO_DEFESA_1_INSTANCIA_DIAS,
                );
                const diasRestantes = diasCorridosRestantesDefesa(
                  item.dataCientificacao,
                  item.prazoDefesaDias ?? PRAZO_DEFESA_1_INSTANCIA_DIAS,
                );
                const tramiteHref = multasDefesasTramitePath(item.id);

                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="text-base font-semibold sm:text-lg">{tituloCard}</h3>
                        <p className="text-sm text-muted-foreground">
                          {empreendedorNameMap.get(item.empreendedorId) || "—"} ·{" "}
                          {projectNameMap.get(item.projectId) || "—"}
                        </p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {getDefesaResumoText(item) || "Sem resumo"}
                        </p>
                        {getDefesaSinteseAuto(item) ? (
                          <p className="line-clamp-1 text-sm text-muted-foreground">
                            {getDefesaSinteseAuto(item)}
                          </p>
                        ) : null}
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {getDefesaMotivosLinha(item) || "Sem dados do auto"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{MULTA_STATUS_LABELS[status]}</Badge>
                          {item.dataCientificacao ? (
                            <Badge
                              variant={
                                diasRestantes !== null && diasRestantes <= 5
                                  ? "destructive"
                                  : "outline"
                              }
                              className="gap-1"
                            >
                              <Clock className="h-3 w-3" />
                              {prazoLabel}
                            </Badge>
                          ) : null}
                        </div>
                        {item.decisaoEncerramento ? (
                          <p className="text-xs text-muted-foreground">
                            {DECISAO_ENCERRAMENTO_LABELS[item.decisaoEncerramento.tipo]} —{" "}
                            {item.decisaoEncerramento.descricao}
                          </p>
                        ) : null}
                      </div>
                      <Separator className="sm:hidden" />
                      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                        <Button size="sm" className="gap-1 w-full sm:w-auto" asChild>
                          <Link href={tramiteHref}>
                            Abrir trâmite
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canWriteDefesa ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive w-full sm:w-auto"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </CardContent>
        </Card>
      </main>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir processo?</AlertDialogTitle>
            <AlertDialogDescription>
              O processo {deleteTarget?.processNumber} será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDelete()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
