'use client';

import * as React from 'react';
import {
  collection,
  doc,
  query,
  serverTimestamp,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type {
  Empreendedor,
  Inventario,
  InventoryProject,
  Project,
} from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLLECTION_CAMPANHAS } from '@/lib/coleta-campo/constants';
import {
  fetchCampanhaColetaDetails,
  hasBlockingCampanhaImportIssues,
  mapCampanhaToInventoryImport,
  validateCampanhaForInventoryImport,
  type CampanhaImportValidationIssue,
} from '@/lib/coleta-campo/map-to-inventory-import';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  project?: InventoryProject | null;
};

function formatCampanhaDate(value: unknown): string {
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

function projectHasImportedData(project?: InventoryProject | null): boolean {
  if (!project) return false;
  return Boolean(
    (project.importedTrees?.length ?? 0) > 0 ||
    (project.importedSpecies?.length ?? 0) > 0 ||
    (project.importedParcels?.length ?? 0) > 0 ||
    project.importSummary,
  );
}

export function ColetaCampanhaImportDialog({
  isOpen,
  onOpenChange,
  projectId,
  project,
}: Props) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = React.useState(false);
  const [issues, setIssues] = React.useState<CampanhaImportValidationIssue[]>([]);
  const [preview, setPreview] = React.useState<ReturnType<
    typeof mapCampanhaToInventoryImport
  > | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = React.useState(false);

  const campanhasQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, COLLECTION_CAMPANHAS),
            where('status', '==', 'concluida'),
            limit(100),
          )
        : null,
    [firestore],
  );
  const { data: campanhas, isLoading: loadingCampanhas } =
    useCollection<Inventario>(campanhasQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'projects'), limit(200)) : null),
    [firestore],
  );
  const { data: projects } = useCollection<Project>(projectsQuery);
  const projectsMap = React.useMemo(
    () => new Map(projects?.map((p) => [p.id, p.propertyName ?? p.id]) ?? []),
    [projects],
  );

  const empreendedoresQuery = useMemoFirebase(
    () =>
      firestore ? query(collection(firestore, 'empreendedores'), limit(200)) : null,
    [firestore],
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = React.useMemo(
    () => new Map(empreendedores?.map((e) => [e.id, e.name]) ?? []),
    [empreendedores],
  );

  const sortedCampanhas = React.useMemo(() => {
    const withExport = (campanhas ?? []).filter((c) => c.exportConsolidatedAt && c.exportExcelUrl);
    return [...withExport].sort((a, b) => {
      const ta = a.exportConsolidatedAt?.toMillis?.() ?? a.updatedAt?.toMillis?.() ?? 0;
      const tb = b.exportConsolidatedAt?.toMillis?.() ?? b.updatedAt?.toMillis?.() ?? 0;
      return Number(tb) - Number(ta);
    });
  }, [campanhas]);

  const selectedCampanha = sortedCampanhas.find((c) => c.id === selectedId);

  const resetState = React.useCallback(() => {
    setStep(1);
    setSelectedId(null);
    setIssues([]);
    setPreview(null);
    setLoadingDetails(false);
    setConfirmReplaceOpen(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen) resetState();
  }, [isOpen, resetState]);

  const loadPreview = async (campanha: Inventario) => {
    if (!firestore) return;
    setLoadingDetails(true);
    setPreview(null);
    setIssues([]);
    try {
      const { parcelas: p, individuos: i } = await fetchCampanhaColetaDetails(
        firestore,
        campanha.id,
      );
      const input = { campanha, parcelas: p, individuos: i };
      const validation = validateCampanhaForInventoryImport(input);
      setIssues(validation);
      setPreview(mapCampanhaToInventoryImport(input));
      setStep(2);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar campanha',
        description: (err as Error).message,
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectCampanha = (id: string) => {
    setSelectedId(id);
  };

  const handleContinueToPreview = () => {
    const campanha = sortedCampanhas.find((c) => c.id === selectedId);
    if (!campanha) {
      toast({
        variant: 'destructive',
        title: 'Selecione uma campanha',
        description: 'Escolha uma campanha concluída na Coleta de campo.',
      });
      return;
    }
    void loadPreview(campanha);
  };

  const persistImport = async () => {
    if (!firestore || !projectId || !preview || !selectedCampanha) return;
    setSaving(true);
    try {
      const ref = doc(firestore, 'inventories', projectId);
      await updateDoc(ref, {
        importedSpecies: preview.importedSpecies,
        importedParcels: preview.importedParcels,
        importedTrees: preview.importedTrees,
        importSummary: {
          importedAt: serverTimestamp(),
          totalSpecies: preview.importedSpecies.length,
          totalParcels: preview.importedParcels.length,
          totalTrees: preview.importedTrees.length,
          source: 'coleta_campo',
          coletaCampanhaId: selectedCampanha.id,
        },
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Dados carregados da Coleta de campo',
        description: `Espécies: ${preview.importedSpecies.length}, Parcelas: ${preview.importedParcels.length}, Árvores: ${preview.importedTrees.length}.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: (err as Error).message,
      });
    } finally {
      setSaving(false);
      setConfirmReplaceOpen(false);
    }
  };

  const handleConfirmImport = () => {
    if (hasBlockingCampanhaImportIssues(issues)) {
      toast({
        variant: 'destructive',
        title: 'Corrija os erros antes de importar',
        description: 'A campanha não atende aos requisitos mínimos.',
      });
      return;
    }
    if (projectHasImportedData(project)) {
      setConfirmReplaceOpen(true);
      return;
    }
    void persistImport();
  };

  const blocking = hasBlockingCampanhaImportIssues(issues);
  const warnings = issues.filter((i) => i.level === 'warn');
  const errors = issues.filter((i) => i.level === 'error');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Carregar da Coleta de Campo
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? 'Escolha uma campanha com planilha consolidada no módulo Coleta de campo. Os dados substituirão o import atual deste projeto, após confirmação.'
                : 'Revise o resumo e confirme o carregamento no inventário.'}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <>
              {loadingCampanhas ? (
                <div className="space-y-2 py-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : sortedCampanhas.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Nenhuma campanha com planilha consolidada. Em{' '}
                    <strong>Coleta de campo</strong>, use{' '}
                    <strong>Marcar concluída e consolidar</strong> (gera e salva o Excel no módulo)
                    antes de carregar aqui.
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="max-h-[min(50vh,400px)] pr-3">
                  <ul className="space-y-2">
                    {sortedCampanhas.map((c) => {
                      const titulo = campanhaTitulo(c, projectsMap, empreendedoresMap);
                      const selected = selectedId === c.id;
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectCampanha(c.id)}
                            className={cn(
                              'w-full rounded-lg border p-3 text-left transition-colors',
                              selected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'hover:bg-muted/50',
                            )}
                          >
                            <div className="font-medium">{titulo}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary">Planilha consolidada</Badge>
                              <span>
                                {c.tipoInventario === 'multinivel' ? 'Multinível' : 'Simples'}
                              </span>
                              {c.exportSummary ? (
                                <span>
                                  {c.exportSummary.totalTrees} árvores ·{' '}
                                  {c.exportSummary.totalParcels} parcelas
                                </span>
                              ) : null}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={!selectedId || loadingDetails}
                  onClick={handleContinueToPreview}
                >
                  {loadingDetails ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando…
                    </>
                  ) : (
                    'Conferir dados'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 2 && selectedCampanha && preview && (
            <>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Campanha: </span>
                  <span className="font-medium">
                    {campanhaTitulo(selectedCampanha, projectsMap, empreendedoresMap)}
                  </span>
                </p>
                <div className="grid grid-cols-3 gap-2 rounded-md border bg-muted/30 p-3">
                  <div>
                    <div className="text-2xl font-semibold">{preview.importedParcels.length}</div>
                    <div className="text-xs text-muted-foreground">Parcelas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{preview.importedSpecies.length}</div>
                    <div className="text-xs text-muted-foreground">Espécies</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{preview.importedTrees.length}</div>
                    <div className="text-xs text-muted-foreground">Árvores</div>
                  </div>
                </div>

                {errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc pl-4 space-y-1">
                        {errors.map((e, i) => (
                          <li key={i}>{e.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {warnings.length > 0 && !blocking && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc pl-4 space-y-1">
                        {warnings.map((e, i) => (
                          <li key={i}>{e.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {!blocking && errors.length === 0 && warnings.length === 0 && (
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Dados prontos para carregar no projeto.
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setPreview(null);
                    setIssues([]);
                  }}
                  disabled={saving}
                >
                  Voltar
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={blocking || saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando…
                    </>
                  ) : (
                    'Carregar no projeto'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir dados importados?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Este projeto já possui dados importados
                  {project?.importSummary?.totalTrees != null && (
                    <> ({project.importSummary.totalTrees} árvores)</>
                  )}
                  . Ao continuar, espécies, parcelas e árvores atuais serão{' '}
                  <strong>substituídos</strong> pelos da campanha selecionada.
                </p>
                {preview && (
                  <p>
                    Novo total: {preview.importedTrees.length} árvores,{' '}
                    {preview.importedParcels.length} parcelas, {preview.importedSpecies.length}{' '}
                    espécies.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                void persistImport();
              }}
            >
              {saving ? 'Salvando…' : 'Substituir e carregar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
