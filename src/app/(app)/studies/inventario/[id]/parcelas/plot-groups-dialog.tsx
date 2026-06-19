'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Trash2, Loader2, MapPin } from 'lucide-react';
import { inventoryActionButtonClass } from '../inventory-module-chrome';
import { cn } from '@/lib/utils';
import { useDoc, useFirebase } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { CoordinateStringField } from '@/components/coordinates';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  inventoryUnitLatLngToInputString,
  inputStringToInventoryUnitLatLng,
} from '@/lib/inventario/inventory-unit-coordenadas';
import type {
  InventoryInclusionLevel,
  InventoryPlotGroups,
  InventoryPrimaryUnit,
  InventoryProject,
  InventoryStratum,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`;
}

function emptyPlotGroups(): InventoryPlotGroups {
  return { inclusionLevels: [], strata: [], primaryUnits: [] };
}

function formatUnitCornerSummary(lat: string, lon: string): string {
  const latT = lat.trim();
  const lonT = lon.trim();
  if (!latT && !lonT) return '—';
  if (latT && lonT) return `${latT}, ${lonT}`;
  return latT || lonT;
}

function UnitCornerCoordinateCell({
  lat,
  lon,
  label,
  onChange,
}: {
  lat: string;
  lon: string;
  label: string;
  onChange: (lat: string, lon: string) => void;
}) {
  const inputValue = inventoryUnitLatLngToInputString({ lat, lon });
  const summary = formatUnitCornerSummary(lat, lon);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-w-[96px] max-w-[140px] justify-start truncate px-2 text-xs font-normal"
          title={summary !== '—' ? `${label}: ${summary}` : label}
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin className="mr-1 h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate">{summary}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-2rem,22rem)]"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {label} · SIRGAS 2000 (UTM 23S ou GMS)
        </p>
        <CoordinateStringField
          value={inputValue}
          onChange={(raw) => {
            const pair = inputStringToInventoryUnitLatLng(raw);
            onChange(pair.lat ?? '', pair.lon ?? '');
          }}
          variant="coords-only"
        />
      </PopoverContent>
    </Popover>
  );
}

export function PlotGroupsDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const projectRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const { data: project } = useDoc<InventoryProject>(projectRef);

  const [levels, setLevels] = React.useState<InventoryInclusionLevel[]>([]);
  const [strata, setStrata] = React.useState<InventoryStratum[]>([]);
  const [units, setUnits] = React.useState<InventoryPrimaryUnit[]>([]);
  const [selLevel, setSelLevel] = React.useState<string | null>(null);
  const [selStratum, setSelStratum] = React.useState<string | null>(null);
  const [selUnit, setSelUnit] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const hydratedForOpen = React.useRef(false);

  const hydrate = React.useCallback(() => {
    const pg = project?.plotGroups;
    setLevels(pg?.inclusionLevels?.length ? [...pg.inclusionLevels] : []);
    setStrata(pg?.strata?.length ? [...pg.strata] : []);
    setUnits(pg?.primaryUnits?.length ? [...pg.primaryUnits] : []);
    setSelLevel(null);
    setSelStratum(null);
    setSelUnit(null);
  }, [project?.plotGroups]);

  React.useEffect(() => {
    if (!open) {
      hydratedForOpen.current = false;
      return;
    }
    if (!project) return;
    if (!hydratedForOpen.current) {
      hydrate();
      hydratedForOpen.current = true;
    }
  }, [open, project, hydrate]);

  const selectedStratumCodigo = React.useMemo(() => {
    if (!selStratum) return null;
    return strata.find((s) => s.id === selStratum)?.codigo ?? null;
  }, [selStratum, strata]);

  const filteredUnits = React.useMemo(() => {
    if (!selectedStratumCodigo) return units;
    return units.filter((u) => !u.estratoCodigo || u.estratoCodigo === selectedStratumCodigo);
  }, [units, selectedStratumCodigo]);

  const patchLevel = (id: string, patch: Partial<InventoryInclusionLevel>) => {
    setLevels((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const patchStratum = (id: string, patch: Partial<InventoryStratum>) => {
    setStrata((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const patchUnit = (id: string, patch: Partial<InventoryPrimaryUnit>) => {
    setUnits((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const insertLevel = () => {
    const id = newId();
    setLevels((p) => [...p, { id, codNi: '', descricao: '', areaM2: 0 }]);
    setSelLevel(id);
  };
  const deleteLevel = () => {
    if (!selLevel) {
      toast({ title: 'Nível de inclusão', description: 'Selecione uma linha.' });
      return;
    }
    setLevels((p) => p.filter((r) => r.id !== selLevel));
    setSelLevel(null);
  };

  const insertStratum = () => {
    const id = newId();
    setStrata((p) => [...p, { id, codigo: String(p.length + 1), descricao: `Estrato ${p.length + 1}`, areaHa: 0 }]);
    setSelStratum(id);
  };
  const deleteStratum = () => {
    if (!selStratum) {
      toast({ title: 'Estratos', description: 'Selecione uma linha.' });
      return;
    }
    const cod = strata.find((s) => s.id === selStratum)?.codigo;
    setStrata((p) => p.filter((r) => r.id !== selStratum));
    if (cod) setUnits((p) => p.filter((u) => u.estratoCodigo !== cod));
    setSelStratum(null);
  };

  const insertUnit = () => {
    const id = newId();
    setUnits((p) => [
      ...p,
      {
        id,
        unidade: '',
        areaM2: 0,
        descricao: '',
        largura: 0,
        comprimento: 0,
        lat1: '',
        lon1: '',
        lat2: '',
        lon2: '',
        declividade: '',
        altitude: '',
        estratoCodigo: selectedStratumCodigo ?? undefined,
      },
    ]);
    setSelUnit(id);
  };
  const deleteUnit = () => {
    if (!selUnit) {
      toast({ title: 'Unidades primárias', description: 'Selecione uma linha.' });
      return;
    }
    setUnits((p) => p.filter((r) => r.id !== selUnit));
    setSelUnit(null);
  };

  const handleSave = async () => {
    if (!firestore || !projectRef) {
      toast({ variant: 'destructive', title: 'Firestore', description: 'Indisponível.' });
      return;
    }
    setSaving(true);
    try {
      const plotGroups: InventoryPlotGroups = {
        inclusionLevels: levels,
        strata,
        primaryUnits: units,
      };
      await updateDoc(projectRef, {
        plotGroups,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Gravado', description: 'Grupos de parcela guardados no projeto.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gravar',
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-left text-lg font-semibold text-primary">Grupos de Parcela</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-md border bg-card">
              <div className="border-b px-3 py-2 text-sm font-medium">Nível de Inclusão</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Cód. NI</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-28 text-right">Área (m²)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-20 text-center text-sm text-muted-foreground">
                        Sem linhas para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    levels.map((row) => (
                      <TableRow
                        key={row.id}
                        className={cn(selLevel === row.id && 'bg-emerald-50 dark:bg-emerald-950/25')}
                        onClick={() => setSelLevel(row.id)}
                      >
                        <TableCell className="p-1">
                          <Input
                            className="h-8"
                            value={row.codNi}
                            onChange={(e) => patchLevel(row.id, { codNi: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8"
                            value={row.descricao}
                            onChange={(e) => patchLevel(row.id, { descricao: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1 text-right">
                          <Input
                            className="h-8 text-right"
                            type="number"
                            value={Number.isFinite(row.areaM2) ? row.areaM2 : 0}
                            onChange={(e) => patchLevel(row.id, { areaM2: Number(e.target.value) || 0 })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2 border-t p-2">
                <Button type="button" size="sm" className={inventoryActionButtonClass('insert')} onClick={insertLevel}>
                  <Plus className="mr-1 h-4 w-4" />
                  Inserir
                </Button>
                <Button type="button" size="sm" variant="outline" className={inventoryActionButtonClass('delete')} onClick={deleteLevel}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </section>
            <section className="rounded-md border bg-card">
              <div className="border-b px-3 py-2 text-sm font-medium">Estratos</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Código estrato</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-28 text-right">Área (ha)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strata.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-20 text-center text-sm text-muted-foreground">
                        Sem linhas para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    strata.map((row) => (
                      <TableRow
                        key={row.id}
                        className={cn(selStratum === row.id && 'bg-emerald-50 dark:bg-emerald-950/25', 'cursor-pointer')}
                        onClick={() => setSelStratum(row.id)}
                      >
                        <TableCell className="p-1">
                          <Input
                            className="h-8"
                            value={row.codigo}
                            onChange={(e) => patchStratum(row.id, { codigo: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8"
                            value={row.descricao}
                            onChange={(e) => patchStratum(row.id, { descricao: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1 text-right">
                          <Input
                            className="h-8 text-right"
                            type="number"
                            step="0.01"
                            value={Number.isFinite(row.areaHa) ? row.areaHa : 0}
                            onChange={(e) => patchStratum(row.id, { areaHa: Number(e.target.value) || 0 })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2 border-t p-2">
                <Button type="button" size="sm" className={inventoryActionButtonClass('insert')} onClick={insertStratum}>
                  <Plus className="mr-1 h-4 w-4" />
                  Inserir
                </Button>
                <Button type="button" size="sm" variant="outline" className={inventoryActionButtonClass('delete')} onClick={deleteStratum}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </section>
          </div>
          <section className="rounded-md border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
              <span className="text-sm font-medium">Unidades Primárias</span>
              {selectedStratumCodigo ? (
                <span className="text-xs text-muted-foreground">
                  Filtradas pelo estrato selecionado: <strong>{selectedStratumCodigo}</strong> (e linhas sem estrato)
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Selecione um estrato para filtrar ou mostre todas.</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Unidade</TableHead>
                    <TableHead>Área (m²)</TableHead>
                    <TableHead className="min-w-[120px]">Descrição</TableHead>
                    <TableHead>Estrato</TableHead>
                    <TableHead>Larg.</TableHead>
                    <TableHead>Comp.</TableHead>
                    <TableHead className="min-w-[108px]">Ponto 1</TableHead>
                    <TableHead className="min-w-[108px]">Ponto 2</TableHead>
                    <TableHead>Decl.</TableHead>
                    <TableHead>Alt.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-20 text-center text-sm text-muted-foreground">
                        Sem linhas para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUnits.map((row) => (
                      <TableRow
                        key={row.id}
                        className={cn(selUnit === row.id && 'bg-emerald-50 dark:bg-emerald-950/25')}
                        onClick={() => setSelUnit(row.id)}
                      >
                        <TableCell className="p-1">
                          <Input
                            className="h-8 min-w-[88px]"
                            value={row.unidade}
                            onChange={(e) => patchUnit(row.id, { unidade: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8 w-20"
                            type="number"
                            value={Number.isFinite(row.areaM2) ? row.areaM2 : 0}
                            onChange={(e) => patchUnit(row.id, { areaM2: Number(e.target.value) || 0 })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8 min-w-[100px]"
                            value={row.descricao}
                            onChange={(e) => patchUnit(row.id, { descricao: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8 w-16"
                            value={row.estratoCodigo ?? ''}
                            placeholder="—"
                            onChange={(e) =>
                              patchUnit(row.id, { estratoCodigo: e.target.value.trim() || undefined })
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8 w-16"
                            type="number"
                            value={Number.isFinite(row.largura) ? row.largura : 0}
                            onChange={(e) => patchUnit(row.id, { largura: Number(e.target.value) || 0 })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8 w-16"
                            type="number"
                            value={Number.isFinite(row.comprimento) ? row.comprimento : 0}
                            onChange={(e) => patchUnit(row.id, { comprimento: Number(e.target.value) || 0 })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <UnitCornerCoordinateCell
                            lat={row.lat1}
                            lon={row.lon1}
                            label="Ponto 1"
                            onChange={(lat1, lon1) => patchUnit(row.id, { lat1, lon1 })}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <UnitCornerCoordinateCell
                            lat={row.lat2}
                            lon={row.lon2}
                            label="Ponto 2"
                            onChange={(lat2, lon2) => patchUnit(row.id, { lat2, lon2 })}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8 w-16"
                            value={row.declividade}
                            onChange={(e) => patchUnit(row.id, { declividade: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-8 w-16"
                            value={row.altitude}
                            onChange={(e) => patchUnit(row.id, { altitude: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2 border-t p-2">
              <Button type="button" size="sm" className={inventoryActionButtonClass('insert')} onClick={insertUnit}>
                <Plus className="mr-1 h-4 w-4" />
                Inserir
              </Button>
              <Button type="button" size="sm" variant="outline" className={inventoryActionButtonClass('delete')} onClick={deleteUnit}>
                <Trash2 className="mr-1 h-4 w-4" />
                Excluir
              </Button>
            </div>
          </section>
        </div>
        <DialogFooter className="flex flex-wrap gap-2 border-t px-6 py-3 sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving} className={inventoryActionButtonClass('insert')}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
