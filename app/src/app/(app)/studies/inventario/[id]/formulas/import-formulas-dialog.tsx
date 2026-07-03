'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, Search, X, Loader2 } from 'lucide-react';
import { inventoryActionButtonClass } from '../inventory-module-chrome';
import { useFirebase, useUser } from '@/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { InventoryFormula, InventoryProject } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type SourceRow = {
  key: string;
  sourceProjectId: string;
  sourceProjectName: string;
  formula: InventoryFormula;
};

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`;
}

export function ImportFormulasDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<SourceRow[]>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [filterProject, setFilterProject] = React.useState<string>('_all');
  const [filterText, setFilterText] = React.useState('');
  const [importing, setImporting] = React.useState(false);

  const loadRows = React.useCallback(async () => {
    if (!firestore || !user?.id) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(firestore, 'inventories'),
        where('ownerId', '==', user.id),
        limit(100),
      );
      const snap = await getDocs(q);
      const list: SourceRow[] = [];
      snap.forEach((d) => {
        if (d.id === projectId) return;
        const inv = d.data() as InventoryProject;
        const nome = inv.nome || d.id;
        const formulas = inv.inventoryFormulas ?? [];
        formulas.forEach((f) => {
          list.push({
            key: `${d.id}__${f.id}`,
            sourceProjectId: d.id,
            sourceProjectName: nome,
            formula: f,
          });
        });
      });
      setRows(list);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao listar inventários',
        description: (e as Error).message,
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [firestore, user?.id, projectId, toast]);

  React.useEffect(() => {
    if (!open) {
      setSelected({});
      setFilterText('');
      setFilterProject('_all');
      return;
    }
    void loadRows();
  }, [open, loadRows]);

  const projectIds = React.useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(r.sourceProjectId));
    return Array.from(s).sort();
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    let r = rows;
    if (filterProject !== '_all') {
      r = r.filter((x) => x.sourceProjectId === filterProject);
    }
    const t = filterText.trim().toLowerCase();
    if (t) {
      r = r.filter(
        (x) =>
          x.formula.descricao.toLowerCase().includes(t) ||
          x.formula.expressao.toLowerCase().includes(t) ||
          x.sourceProjectName.toLowerCase().includes(t),
      );
    }
    return r;
  }, [rows, filterProject, filterText]);

  const toggle = (key: string) => {
    setSelected((s) => ({ ...s, [key]: !s[key] }));
  };

  const allFilteredKeys = filteredRows.map((r) => r.key);
  const allSelected =
    allFilteredKeys.length > 0 && allFilteredKeys.every((k) => selected[k]);
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((s) => {
        const next = { ...s };
        allFilteredKeys.forEach((k) => {
          delete next[k];
        });
        return next;
      });
    } else {
      setSelected((s) => {
        const next = { ...s };
        allFilteredKeys.forEach((k) => {
          next[k] = true;
        });
        return next;
      });
    }
  };

  const clearFilters = () => {
    setFilterProject('_all');
    setFilterText('');
  };

  const handleImport = async () => {
    if (!firestore || !user?.id) return;
    const picks = rows.filter((r) => selected[r.key]);
    if (picks.length === 0) {
      toast({ title: 'Importar', description: 'Selecione pelo menos uma fórmula.' });
      return;
    }
    const projectRef = doc(firestore, 'inventories', projectId);
    setImporting(true);
    try {
      const curSnap = await getDoc(projectRef);
      const cur = (curSnap.data() as InventoryProject | undefined)?.inventoryFormulas ?? [];
      const existingExpr = new Set(cur.map((f) => f.expressao.trim().toLowerCase()));
      const merged: InventoryFormula[] = [...cur];
      const now = new Date().toLocaleString('pt-BR');
      for (const p of picks) {
        const ex = p.formula.expressao.trim().toLowerCase();
        if (existingExpr.has(ex)) continue;
        existingExpr.add(ex);
        merged.push({
          id: newId(),
          descricao: p.formula.descricao,
          expressao: p.formula.expressao,
          ativa: p.formula.ativa ?? true,
          dadosDe: now,
        });
      }
      await updateDoc(projectRef, {
        inventoryFormulas: merged,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Importação concluída',
        description: `${merged.length - cur.length} fórmula(s) adicionada(s) (duplicadas por expressão foram ignoradas).`,
      });
      setSelected({});
      onOpenChange(false);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao importar',
        description: (e as Error).message,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-left text-lg">Importar Fórmulas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Selecione fórmulas de outros inventários seus (mesmo proprietário / ownerId).
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => setSelected({})}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar seleção
            </Button>
          </div>
          <div className="space-y-3 rounded-md border p-3">
            <div className="text-sm font-medium">Filtros</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="filtro-projeto">Por projeto</Label>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger id="filtro-projeto">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todos os projetos</SelectItem>
                    {projectIds.map((pid) => (
                      <SelectItem key={pid} value={pid}>
                        {rows.find((r) => r.sourceProjectId === pid)?.sourceProjectName ?? pid}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="filtro-texto">Por descrição/expressão</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="filtro-texto"
                    className="pl-8"
                    placeholder="Buscar…"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          </div>
          <div className="overflow-x-auto rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                A carregar…
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => toggleSelectAll()}
                        aria-label="Selecionar todos"
                        disabled={filteredRows.length === 0}
                      />
                    </TableHead>
                    <TableHead>Nome Projeto</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="min-w-[200px]">Expressão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                        Nenhuma fórmula noutros projetos. Crie fórmulas noutro inventário ou verifique a sessão.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>
                          <Checkbox
                            checked={!!selected[row.key]}
                            onCheckedChange={() => toggle(row.key)}
                            aria-label={`Selecionar ${row.formula.descricao}`}
                          />
                        </TableCell>
                        <TableCell className="text-sm">{row.sourceProjectName}</TableCell>
                        <TableCell className="text-sm">{row.formula.descricao}</TableCell>
                        <TableCell className="font-mono text-xs">{row.formula.expressao}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col gap-3 border-t px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Total encontradas (filtro): {filteredRows.length}</span>
            <span>Selecionadas: {selectedCount}</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button
              type="button"
              className={inventoryActionButtonClass('insert')}
              disabled={importing || !user?.id}
              onClick={() => void handleImport()}
            >
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
