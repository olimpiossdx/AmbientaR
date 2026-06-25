'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirebase } from '@/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import type { InventoryCalculationRun, InventoryProject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { InventoryModuleHeader } from '../../inventory-module-chrome';

function formatRunDate(createdAt: unknown): string {
  if (createdAt && typeof (createdAt as { toDate?: () => Date }).toDate === 'function') {
    try {
      return format((createdAt as { toDate: () => Date }).toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
    } catch {
      /* ignore */
    }
  }
  return '—';
}

function flattenParams(obj: unknown, prefix = ''): { key: string; value: string }[] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return [{ key: prefix || 'valor', value: JSON.stringify(obj) }];
  }
  const rows: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      rows.push(...flattenParams(v, key));
    } else {
      rows.push({ key, value: typeof v === 'string' ? v : JSON.stringify(v) });
    }
  }
  return rows;
}

export function CalculationResultView() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.id as string | undefined) ?? '';
  const runId = (params?.runId as string | undefined) ?? '';
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState('');

  const projectRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const runRef = React.useMemo(() => {
    if (!firestore || !projectId || !runId) return null;
    return doc(firestore, 'inventories', projectId, 'calculationRuns', runId);
  }, [firestore, projectId, runId]);

  const { data: project, isLoading: projectLoading } = useDoc<InventoryProject>(projectRef);
  const { data: run, isLoading: runLoading } = useDoc<InventoryCalculationRun>(runRef);

  React.useEffect(() => {
    if (run?.label) setRenameValue(run.label);
  }, [run?.label]);

  const handleDelete = async () => {
    if (!firestore || !runRef) return;
    if (!window.confirm('Excluir esta execução do histórico?')) return;
    setBusy(true);
    try {
      await deleteDoc(runRef);
      toast({ title: 'Removido', description: 'Execução apagada do histórico.' });
      router.push(`/studies/inventario/${projectId}/calculadora`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleRecalculate = async () => {
    if (!firestore || !projectId || !run) return;
    setBusy(true);
    try {
      const ref = await addDoc(collection(firestore, 'inventories', projectId, 'calculationRuns'), {
        module: run.module,
        subModule: run.subModule,
        label: `${run.label} (recálculo)`,
        parameters: run.parameters,
        result: {
          message: 'Recálculo registado (motor numérico em desenvolvimento).',
        },
        status: 'stub' as const,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Nova execução', description: 'Abrir resultado recém-criado.' });
      router.push(`/studies/inventario/${projectId}/resultado/${ref.id}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async () => {
    if (!firestore || !runRef || !renameValue.trim()) return;
    setBusy(true);
    try {
      await updateDoc(runRef, { label: renameValue.trim() });
      toast({ title: 'Renomeado' });
      setRenameOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const paramRows = React.useMemo(() => flattenParams(run?.parameters ?? {}), [run?.parameters]);
  const resultRows = React.useMemo(() => flattenParams(run?.result ?? {}), [run?.result]);

  return (
    <>
      <InventoryModuleHeader projectName={project?.nome} section="Resultado de cálculo">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/studies/inventario/${projectId}/calculadora`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Calculadora
          </Link>
        </Button>
      </InventoryModuleHeader>
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-3 py-2 md:px-4">
        <Button type="button" variant="outline" size="sm" disabled={busy || runLoading} onClick={() => void handleDelete()}>
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir do histórico
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={busy || !run} onClick={() => void handleRecalculate()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Recalcular
        </Button>
        <Button type="button" variant="outline" size="sm" disabled title="Em breve">
          Gráfico
        </Button>
        <Button type="button" variant="outline" size="sm" disabled title="Em breve">
          Colunas
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toast({ title: 'Exportar', description: 'Exportação Excel em breve.' })}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toast({ title: 'Exportar', description: 'Exportação Word em breve.' })}
        >
          <FileText className="mr-2 h-4 w-4" />
          Word
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!run} onClick={() => setRenameOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Renomear
        </Button>
      </div>

      <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
        {runLoading || projectLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !run ? (
          <p className="text-sm text-muted-foreground">Execução não encontrada ou sem permissão.</p>
        ) : (
          <>
            <div className="rounded-md border bg-card p-4">
              <h2 className="text-lg font-semibold">{run.label}</h2>
              <p className="text-sm text-muted-foreground">
                Módulo: {run.module}
                {run.subModule ? ` · ${run.subModule}` : ''} · {formatRunDate(run.createdAt)} · Estado: {run.status}
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-medium">Parâmetros</h3>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campo</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paramRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-muted-foreground">
                            —
                          </TableCell>
                        </TableRow>
                      ) : (
                        paramRows.map((r) => (
                          <TableRow key={r.key}>
                            <TableCell className="font-mono text-xs">{r.key}</TableCell>
                            <TableCell className="max-w-md break-words text-sm">{r.value}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Resultado</h3>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campo</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-muted-foreground">
                            —
                          </TableCell>
                        </TableRow>
                      ) : (
                        resultRows.map((r) => (
                          <TableRow key={r.key}>
                            <TableCell className="font-mono text-xs">{r.key}</TableCell>
                            <TableCell className="max-w-md break-words text-sm">{r.value}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear execução</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rn-label">Nome</Label>
            <Input id="rn-label" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setRenameOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={busy} onClick={() => void handleRename()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
