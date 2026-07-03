'use client';

import * as React from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import type { Oficio } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  canDeleteCounterRow,
  counterDocToRow,
  formatOficioNumberFromSequence,
  getCurrentCalendarYear,
  maxConcludedSequenceInYear,
  nextSequenceAfterApproval,
  parseCounterLastInput,
  parseCounterYearInput,
  sortCounterRowsDesc,
  validateCounterSave,
  type OficioCounterDoc,
  type OficioCounterRow,
} from '@/lib/oficio-counter';

type Props = {
  oficios?: Oficio[] | null;
};

export function OficioCounterSettings({ oficios }: Props) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const calendarYear = getCurrentCalendarYear();

  const [formYear, setFormYear] = React.useState(String(calendarYear));
  const [lastUsedInput, setLastUsedInput] = React.useState('');
  const [rows, setRows] = React.useState<OficioCounterRow[]>([]);
  const [listLoading, setListLoading] = React.useState(true);
  const [formLoading, setFormLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingYear, setEditingYear] = React.useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<OficioCounterRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const oficioList = oficios ?? [];

  const loadAllCounters = React.useCallback(async () => {
    if (!firestore) return;
    setListLoading(true);
    try {
      const snap = await getDocs(collection(firestore, 'oficioCounters'));
      const loaded: OficioCounterRow[] = [];
      snap.forEach((d) => {
        const y = parseInt(d.id, 10);
        if (!Number.isFinite(y)) return;
        const data = d.data() as OficioCounterDoc;
        if (typeof data.lastSequence !== 'number') return;
        loaded.push(counterDocToRow(y, data));
      });
      setRows(sortCounterRowsDesc(loaded));
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar contadores',
        description: 'Não foi possível listar os anos configurados.',
      });
    } finally {
      setListLoading(false);
    }
  }, [firestore, toast]);

  React.useEffect(() => {
    void loadAllCounters();
  }, [loadAllCounters]);

  const yearNum = parseCounterYearInput(formYear);
  const maxOnPlatform =
    yearNum !== null ? maxConcludedSequenceInYear(oficioList, yearNum) : 0;

  React.useEffect(() => {
    if (!firestore || yearNum === null) return;
    let cancelled = false;
    setFormLoading(true);
    getDoc(doc(firestore, 'oficioCounters', String(yearNum)))
      .then((snap) => {
        if (cancelled) return;
        const last = snap.exists() ? snap.data()?.lastSequence : undefined;
        if (typeof last === 'number' && last >= 0) {
          setLastUsedInput(String(last));
        } else {
          setLastUsedInput(maxOnPlatform > 0 ? String(maxOnPlatform) : '0');
        }
      })
      .catch(() => {
        if (!cancelled) setLastUsedInput(maxOnPlatform > 0 ? String(maxOnPlatform) : '0');
      })
      .finally(() => {
        if (!cancelled) setFormLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [firestore, yearNum, maxOnPlatform]);

  const parsedLast = parseCounterLastInput(lastUsedInput);
  const nextPreview =
    yearNum !== null && parsedLast !== null
      ? formatOficioNumberFromSequence(
          nextSequenceAfterApproval(parsedLast, oficioList, yearNum),
          yearNum,
        )
      : '—';

  function resetFormToCurrentYear() {
    setEditingYear(null);
    setFormYear(String(calendarYear));
  }

  function startEdit(row: OficioCounterRow) {
    setEditingYear(row.year);
    setFormYear(String(row.year));
    setLastUsedInput(String(row.lastSequence));
  }

  async function handleSave() {
    if (!firestore || !user) return;
    if (yearNum === null) {
      toast({ variant: 'destructive', title: 'Ano inválido', description: 'Use um ano entre 2000 e 2100.' });
      return;
    }
    if (parsedLast === null) {
      toast({
        variant: 'destructive',
        title: 'Valor inválido',
        description: 'Informe o último número já utilizado (0 se nenhum foi emitido).',
      });
      return;
    }

    const validation = validateCounterSave(yearNum, parsedLast, oficioList);
    if (!validation.ok) {
      toast({ variant: 'destructive', title: 'Não foi possível salvar', description: validation.message });
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(firestore, 'oficioCounters', String(yearNum)),
        {
          lastSequence: parsedLast,
          updatedAt: new Date().toISOString(),
          updatedBy: user.uid,
        },
        { merge: true },
      );
      toast({
        title: editingYear !== null ? 'Contador atualizado' : 'Contador gravado',
        description:
          yearNum === calendarYear
            ? `Próxima aprovação em ${calendarYear}: ${nextPreview}.`
            : `Ano ${yearNum} configurado. Aprovações em ${calendarYear} usam o contador de ${calendarYear}.`,
      });
      setEditingYear(null);
      await loadAllCounters();
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Verifique permissões (admin) e tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!firestore || !deleteTarget) return;
    const check = canDeleteCounterRow(deleteTarget.year, oficioList);
    if (!check.ok) {
      toast({ variant: 'destructive', title: 'Não é possível excluir', description: check.message });
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'oficioCounters', String(deleteTarget.year)));
      toast({
        title: 'Contador removido',
        description: `Registo de ${deleteTarget.year} excluído. Aprovações nesse ano passam a considerar só os ofícios já concluídos na plataforma.`,
      });
      if (editingYear === deleteTarget.year) resetFormToCurrentYear();
      setDeleteTarget(null);
      await loadAllCounters();
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Verifique permissões (admin) e regras Firestore publicadas.',
      });
    } finally {
      setDeleting(false);
    }
  }

  const currentYearRow = rows.find((r) => r.year === calendarYear);
  const approvalHint = `Novas aprovações usam sempre o ano ${calendarYear} (calendário).`;

  return (
    <>
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Numeração anual (administrador)</CardTitle>
            <Badge variant="secondary">Ano corrente: {calendarYear}</Badge>
          </div>
          <CardDescription>
            Um contador por ano civil. Ao mudar o ano, a numeração recomeça automaticamente no novo
            ano (ex.: 001/{calendarYear + 1}), salvo se definir manualmente o último número usado.
            Concilie ofícios emitidos fora da plataforma; reverter um ofício concluído não altera o
            contador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">{approvalHint}</p>

          <div className="rounded-lg border bg-card/50 p-4 sm:p-5 space-y-5">
            {currentYearRow ? (
              <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm leading-relaxed">
                <span className="text-muted-foreground">Contador de {calendarYear}:</span>{' '}
                último{' '}
                <span className="font-mono font-semibold tabular-nums">
                  {formatOficioNumberFromSequence(currentYearRow.lastSequence, calendarYear)}
                </span>
                <span className="mx-1.5 text-muted-foreground" aria-hidden>
                  ·
                </span>
                próxima aprovação{' '}
                <span className="font-mono font-semibold tabular-nums">
                  {formatOficioNumberFromSequence(
                    nextSequenceAfterApproval(
                      currentYearRow.lastSequence,
                      oficioList,
                      calendarYear,
                    ),
                    calendarYear,
                  )}
                </span>
              </div>
            ) : (
              <p className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground leading-relaxed">
                Sem contador gravado para {calendarYear}. A primeira aprovação usará{' '}
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {formatOficioNumberFromSequence(
                    nextSequenceAfterApproval(null, oficioList, calendarYear),
                    calendarYear,
                  )}
                </span>{' '}
                (ou o seguinte ao maior já concluído na plataforma).
              </p>
            )}

            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold">
                {editingYear !== null ? `Editar contador — ${editingYear}` : 'Adicionar ou ajustar ano'}
              </p>
              {editingYear !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full shrink-0 sm:w-auto"
                  onClick={resetFormToCurrentYear}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Cancelar edição
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:items-start md:gap-x-4">
              <div className="space-y-2 md:col-span-3 lg:col-span-2">
                <Label htmlFor="oficio-counter-year">Ano</Label>
                <Input
                  id="oficio-counter-year"
                  className="w-full max-w-[7.5rem] md:max-w-none"
                  inputMode="numeric"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                {yearNum !== null && yearNum !== calendarYear && (
                  <p className="text-xs leading-snug text-amber-700 dark:text-amber-400">
                    Só aprovações em {calendarYear} usam este ano na numeração automática.
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-5 lg:col-span-5">
                <Label htmlFor="oficio-counter-last">Último nº já utilizado</Label>
                <Input
                  id="oficio-counter-last"
                  type="number"
                  min={0}
                  className="w-full"
                  disabled={formLoading}
                  value={lastUsedInput}
                  onChange={(e) => setLastUsedInput(e.target.value)}
                  placeholder="Ex: 14"
                />
                {maxOnPlatform > 0 && yearNum !== null && (
                  <p className="text-xs leading-snug text-muted-foreground">
                    Na plataforma, o maior concluído em {yearNum} é{' '}
                    <span className="font-mono tabular-nums">
                      {formatOficioNumberFromSequence(maxOnPlatform, yearNum)}
                    </span>
                    .
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-4 lg:col-span-5">
                <Label htmlFor="oficio-counter-next-preview">Próximo ao aprovar</Label>
                <div
                  id="oficio-counter-next-preview"
                  className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 font-mono text-sm tabular-nums"
                  aria-live="polite"
                >
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    nextPreview
                  )}
                </div>
                <p className="text-xs leading-snug text-muted-foreground">
                  Pré-visualização com base no último número informado.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-start">
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={handleSave}
                disabled={saving || formLoading}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingYear !== null ? (
                  'Atualizar'
                ) : (
                  'Salvar contador'
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Contadores por ano</p>
            {listLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando…
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nenhum ano configurado ainda. Salve o contador de {calendarYear} ou de anos anteriores
                para conciliação.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead>Último nº</TableHead>
                    <TableHead>Próximo (se aprovar nesse ano)</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const platformMax = maxConcludedSequenceInYear(oficioList, row.year);
                    const nextIfApproved = formatOficioNumberFromSequence(
                      nextSequenceAfterApproval(row.lastSequence, oficioList, row.year),
                      row.year,
                    );
                    const isCurrent = row.year === calendarYear;
                    return (
                      <TableRow key={row.year} className={isCurrent ? 'bg-amber-500/10' : undefined}>
                        <TableCell>
                          <span className="font-medium tabular-nums">{row.year}</span>
                          {isCurrent && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Corrente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">
                          {formatOficioNumberFromSequence(row.lastSequence, row.year)}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums text-muted-foreground">
                          {nextIfApproved}
                          {platformMax > row.lastSequence && (
                            <span className="block text-xs font-sans text-amber-700 dark:text-amber-400">
                              Plataforma tem até {formatOficioNumberFromSequence(platformMax, row.year)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Editar contador de ${row.year}`}
                              onClick={() => startEdit(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Excluir contador de ${row.year}`}
                              onClick={() => setDeleteTarget(row)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contador de {deleteTarget?.year}?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento em Firestore será removido. Só é permitido se não houver ofícios concluídos
              nesse ano na plataforma. Aprovações no ano corrente ({calendarYear}) não são afetadas
              por contadores de outros anos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
