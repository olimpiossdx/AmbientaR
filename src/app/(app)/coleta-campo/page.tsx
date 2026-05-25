'use client';

import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Eye, Trash2, Loader2 } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';
import type { Empreendedor, Inventario, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ColetaOfflineBanner } from '@/components/coleta-campo/coleta-offline-banner';
import { CAMPANHA_STATUS_LABEL, COLETA_CAMPO_BASE } from '@/lib/coleta-campo/constants';
import { deleteCampanha } from '@/lib/coleta-campo/delete-campanha';
import { useToast } from '@/hooks/use-toast';
import { CardSearchInput } from '@/components/card-search-input';

function formatDate(value: string | unknown): string {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  const date = (value as { toDate?: () => Date })?.toDate
    ? (value as { toDate: () => Date }).toDate()
    : new Date(value as string);
  return date.toLocaleDateString('pt-BR');
}

function campanhaTitulo(
  inv: Inventario,
  projectsMap: Map<string, string>,
  empreendedoresMap: Map<string, string>,
): string {
  if (inv.modo === 'solta') {
    return inv.nomeEmpreendimentoManual?.trim() || 'Campanha solta';
  }
  const emp = projectsMap.get(inv.empreendimentoId ?? '') ?? inv.empreendimentoId ?? '—';
  const ent = inv.empreendedorId
    ? empreendedoresMap.get(inv.empreendedorId) ?? ''
    : '';
  return ent ? `${emp} (${ent})` : emp;
}

export default function ColetaCampoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [deleteTarget, setDeleteTarget] = useState<Inventario | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const campanhasQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'inventarios'), limit(200)) : null),
    [firestore],
  );
  const { data: campanhas, isLoading } = useCollection<Inventario>(campanhasQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'projects'), limit(200)) : null),
    [firestore],
  );
  const { data: projects } = useCollection<Project>(projectsQuery);
  const projectsMap = useMemo(
    () => new Map(projects?.map((p) => [p.id, p.propertyName ?? p.id]) ?? []),
    [projects],
  );

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'empreendedores'), limit(200)) : null),
    [firestore],
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = useMemo(
    () => new Map(empreendedores?.map((e) => [e.id, e.name]) ?? []),
    [empreendedores],
  );

  const sorted = useMemo(
    () =>
      [...(campanhas ?? [])].sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() ?? a.updatedAt ?? 0;
        const tb = b.updatedAt?.toMillis?.() ?? b.updatedAt ?? 0;
        return Number(tb) - Number(ta);
      }),
    [campanhas],
  );

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter((inv) => {
      const titulo = campanhaTitulo(inv, projectsMap, empreendedoresMap).toLowerCase();
      const modo = inv.modo === 'solta' ? 'solta' : 'vinculada';
      const tipo = inv.tipoInventario === 'multinivel' ? 'multinivel' : 'simples';
      const status = (CAMPANHA_STATUS_LABEL[inv.status ?? 'rascunho'] ?? '').toLowerCase();
      return (
        titulo.includes(term) ||
        modo.includes(term) ||
        tipo.includes(term) ||
        status.includes(term)
      );
    });
  }, [sorted, searchTerm, projectsMap, empreendedoresMap]);

  const confirmDelete = useCallback(async () => {
    if (!firestore || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCampanha(firestore, deleteTarget.id);
      toast({
        title: 'Campanha excluída',
        description: 'Parcelas e árvores vinculadas foram removidas.',
      });
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: 'Erro ao excluir',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  }, [firestore, deleteTarget, toast]);

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Coleta de campo">
          <Button size="sm" className="gap-1 min-h-10" onClick={() => router.push(`${COLETA_CAMPO_BASE}/nova`)}>
            <PlusCircle className="h-4 w-4" />
            Nova campanha
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <ColetaOfflineBanner />
          <Card>
            <CardHeader>
              <CardTitle>Campanhas de coleta</CardTitle>
              <CardDescription>
                Coleta offline de parcelas e árvores. Ao concluir, exporte o Excel e importe em{' '}
                <strong>Inventário Florestal</strong> (menu irmão).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      {sorted.length ? `Total: ${sorted.length} campanha(s)` : null}
                    </div>
                    <CardSearchInput
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Buscar por campanha, modo, tipo ou status..."
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-4">
                    {isLoading &&
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-lg" />
                      ))}
                    {!isLoading &&
                      filtered.map((inv) => {
                        const titulo = campanhaTitulo(inv, projectsMap, empreendedoresMap);
                        const periodo =
                          inv.dataInicio || inv.dataFim
                            ? `${formatDate(inv.dataInicio)} – ${formatDate(inv.dataFim)}`
                            : null;
                        return (
                          <Card
                            key={inv.id}
                            className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex flex-col gap-4">
                                <div className="min-w-0 space-y-1.5">
                                  <div className="flex flex-wrap items-start gap-2">
                                    <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                      {titulo}
                                    </h3>
                                    <Badge
                                      variant={
                                        inv.status === 'concluida' || inv.status === 'sincronizado'
                                          ? 'default'
                                          : 'secondary'
                                      }
                                      className="shrink-0"
                                    >
                                      {CAMPANHA_STATUS_LABEL[inv.status ?? 'rascunho']}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {inv.modo === 'solta' ? 'Solta' : 'Vinculada'} ·{' '}
                                    {inv.tipoInventario === 'multinivel' ? 'Multinível' : 'Simples'}
                                  </p>
                                  {periodo ? (
                                    <p className="text-xs text-muted-foreground sm:text-sm">
                                      Período: {periodo}
                                    </p>
                                  ) : null}
                                  {inv.localManual?.trim() ? (
                                    <p className="truncate text-xs text-muted-foreground sm:text-sm">
                                      {inv.localManual}
                                    </p>
                                  ) : null}
                                </div>
                                <Separator className="bg-border/60" />
                                <div className="flex flex-wrap items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        onClick={() => router.push(`${COLETA_CAMPO_BASE}/${inv.id}`)}
                                      >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">Abrir campanha</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Abrir campanha</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                        onClick={() => setDeleteTarget(inv)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Excluir campanha</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Excluir campanha</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    {!isLoading && filtered.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                        {sorted.length
                          ? 'Nenhuma campanha encontrada para o filtro atual.'
                          : 'Nenhuma campanha. Crie uma campanha vinculada ou solta para começar.'}
                      </div>
                    )}
                  </div>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `A campanha "${campanhaTitulo(deleteTarget, projectsMap, empreendedoresMap)}" e todas as parcelas e árvores vinculadas serão removidas permanentemente.`
                : 'Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
