'use client';

import * as React from 'react';
import Link from 'next/link';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Empreendedor as Client, InventoryProject, Project, Request } from '@/lib/types';
import { loadPiaInventorySnapshot } from '@/lib/pia/pia-inventory-snapshot';
import {
  buildMapsFromClientsAndProjects,
  formatRequestProcessLabel,
  sortRequestsForDisplay,
} from '@/lib/pia/pia-request-label';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

const NONE = '__none__';

export function PiaVinculosFields() {
  const form = useFormContext();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [importing, setImporting] = React.useState(false);

  const requestsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'requests') : null),
    [firestore],
  );
  const inventoriesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'inventories') : null),
    [firestore],
  );
  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'clients') : null),
    [firestore],
  );
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );

  const { data: requests, isLoading: loadingRequests } =
    useCollection<Request>(requestsQuery);
  const { data: inventories, isLoading: loadingInventories } =
    useCollection<InventoryProject>(inventoriesQuery);
  const { data: clients } = useCollection<Client>(clientsQuery);
  const { data: projects } = useCollection<Project>(projectsQuery);

  const projectId = form.watch('empreendimento.projectId');
  const requestId = form.watch('requestId');
  const inventoryId = form.watch('inventoryId');

  const requestLabelMaps = React.useMemo(
    () => buildMapsFromClientsAndProjects(clients ?? [], projects ?? []),
    [clients, projects],
  );

  const requestOptions = React.useMemo(() => {
    if (!requests?.length) return [];
    return sortRequestsForDisplay(requests, requestLabelMaps);
  }, [requests, requestLabelMaps]);

  const inventoryOptions = React.useMemo(() => {
    const list = inventories ?? [];
    const filtered = projectId
      ? list.filter((i) => !i.projectId || i.projectId === projectId)
      : list;
    return [...filtered].sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR'),
    );
  }, [inventories, projectId]);

  const handleImportFlora = async () => {
    if (!firestore || !inventoryId || inventoryId === NONE) {
      toast({
        variant: 'destructive',
        title: 'Selecione um inventário',
        description: 'Vincule o projeto de inventário florestal antes de importar.',
      });
      return;
    }
    setImporting(true);
    try {
      const snap = await loadPiaInventorySnapshot(firestore, inventoryId);
      if (!snap) {
        toast({
          variant: 'destructive',
          title: 'Inventário não encontrado',
        });
        return;
      }
      form.setValue('floraResumo', snap.summaryText);
      toast({
        title: 'Flora importada',
        description: `${snap.species.length} espécies resumidas no campo de flora (seção 5).`,
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao importar',
        description: e instanceof Error ? e.message : 'Tente novamente.',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="font-semibold text-base">Vínculos com processo e inventário</h3>
      <FormField
        control={form.control}
        name="requestId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Processo (licenciamento / AIA)</FormLabel>
            <Select
              value={field.value || NONE}
              onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
              disabled={loadingRequests}
            >
              <FormControl>
                <SelectTrigger className="h-auto min-h-10 [&>span]:line-clamp-2 [&>span]:text-left">
                  <SelectValue placeholder="Opcional — vincular trâmite" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-w-[min(100vw-2rem,42rem)]">
                <SelectItem value={NONE}>Nenhum</SelectItem>
                {requestOptions.map((r) => (
                  <SelectItem
                    key={r.id}
                    value={r.id}
                    className="items-start py-2"
                    title={formatRequestProcessLabel(r, requestLabelMaps)}
                  >
                    <span className="whitespace-normal leading-snug">
                      {formatRequestProcessLabel(r, requestLabelMaps)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Ao exportar PDF, o ficheiro pode ser anexado automaticamente à documentação do processo.
            </FormDescription>
            {requestId && (
              <Button type="button" variant="link" className="h-auto p-0" asChild>
                <Link href={`/requests/${requestId}/edit`}>
                  Abrir processo <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="inventoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Inventário florestal</FormLabel>
            <Select
              value={field.value || NONE}
              onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
              disabled={loadingInventories}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional — inventário com planilhas importadas" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE}>Nenhum</SelectItem>
                {inventoryOptions.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.nome}
                    {inv.importSummary?.totalTrees
                      ? ` (${inv.importSummary.totalTrees} árvores)`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={importing || !inventoryId}
                onClick={handleImportFlora}
              >
                {importing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Importar resumo da flora
              </Button>
              {inventoryId && (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/studies/inventario/${inventoryId}`}>
                    Abrir inventário <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="floraResumo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Resumo flora (seção 5 — texto livre)</FormLabel>
            <FormControl>
              <Textarea className="min-h-[120px] font-mono text-sm" {...field} />
            </FormControl>
            <FormDescription>
              Preenchido manualmente ou via importação do inventário. Incluído na exportação Word/PDF.
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}
