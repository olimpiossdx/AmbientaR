'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormDescription, FormLabel } from '@/components/ui/form';
import type {
  License,
  WaterPermit,
  InsignificantWaterUse,
  FieldInspectionAtoVinculado,
  FieldInspectionAtoVinculadoTipo,
  PermitStatus,
} from '@/lib/types';
import { permitStatusBadgeClassRich } from '@/lib/status-display-classes';
import { cn } from '@/lib/utils';
import {
  filterAtosByEmpreendimento,
  filterLicencasParaVistoria,
  filterOutorgasVigentes,
  filterUsosParaVistoria,
  formatLicencaRotulo,
  formatOutorgaRotulo,
  formatUsoInsignificanteRotulo,
  isAtoVinculado,
} from '@/lib/field-inspection-atos-vinculados';

const TIPO_LABEL: Record<FieldInspectionAtoVinculadoTipo, string> = {
  licenca: 'Licença',
  outorga: 'Outorga',
  uso_insignificante: 'Uso insignificante',
};

type AtosVinculadosPickerProps = {
  empreendedorId: string;
  projectId: string;
  licenses: License[];
  outorgas: WaterPermit[];
  usosInsignificantes: InsignificantWaterUse[];
  value: FieldInspectionAtoVinculado[];
  onChange: (atos: FieldInspectionAtoVinculado[]) => void;
};

function AtoListItem({
  rotulo,
  status,
  linked,
  onAdd,
}: {
  rotulo: string;
  status?: PermitStatus;
  linked: boolean;
  onAdd: () => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between',
        linked && 'border-primary/40 bg-primary/5',
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm leading-snug break-words">{rotulo}</p>
        {status ? (
          <Badge variant="outline" className={cn('text-xs', permitStatusBadgeClassRich[status])}>
            {status}
          </Badge>
        ) : null}
      </div>
      <Button
        type="button"
        variant={linked ? 'secondary' : 'outline'}
        size="sm"
        className="min-h-10 shrink-0 w-full sm:w-auto"
        disabled={linked}
        onClick={onAdd}
      >
        <Plus className="h-4 w-4 mr-1" />
        {linked ? 'Vinculado' : 'Vincular'}
      </Button>
    </div>
  );
}

export function AtosVinculadosPicker({
  empreendedorId,
  projectId,
  licenses,
  outorgas,
  usosInsignificantes,
  value,
  onChange,
}: AtosVinculadosPickerProps) {
  const licencas = React.useMemo(() => {
    const filtered = filterAtosByEmpreendimento(licenses, projectId, empreendedorId);
    return filterLicencasParaVistoria(filtered);
  }, [licenses, projectId, empreendedorId]);

  const outorgasVigentes = React.useMemo(() => {
    const filtered = filterAtosByEmpreendimento(outorgas, projectId, empreendedorId);
    return filterOutorgasVigentes(filtered);
  }, [outorgas, projectId, empreendedorId]);

  const usos = React.useMemo(() => {
    const filtered = filterAtosByEmpreendimento(
      usosInsignificantes,
      projectId,
      empreendedorId,
    );
    return filterUsosParaVistoria(filtered);
  }, [usosInsignificantes, projectId, empreendedorId]);

  const addAto = (ato: FieldInspectionAtoVinculado) => {
    if (isAtoVinculado(value, ato.tipo, ato.id)) return;
    onChange([...value, ato]);
  };

  const removeAto = (tipo: FieldInspectionAtoVinculadoTipo, id: string) => {
    onChange(value.filter((a) => !(a.tipo === tipo && a.id === id)));
  };

  const vincularTodos = (tipo: FieldInspectionAtoVinculadoTipo, itens: FieldInspectionAtoVinculado[]) => {
    const next = [...value];
    for (const ato of itens) {
      if (!isAtoVinculado(next, ato.tipo, ato.id)) next.push(ato);
    }
    onChange(next);
  };

  const licencasAtos: FieldInspectionAtoVinculado[] = licencas.map((l) => ({
    tipo: 'licenca' as const,
    id: l.id,
    rotulo: formatLicencaRotulo(l),
  }));

  const outorgasAtos: FieldInspectionAtoVinculado[] = outorgasVigentes.map((o) => ({
    tipo: 'outorga' as const,
    id: o.id,
    rotulo: formatOutorgaRotulo(o),
  }));

  const usosAtos: FieldInspectionAtoVinculado[] = usos.map((u) => ({
    tipo: 'uso_insignificante' as const,
    id: u.id,
    rotulo: formatUsoInsignificanteRotulo(u),
  }));

  if (!empreendedorId || !projectId) {
    return (
      <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-4">
        Selecione o empreendedor e o empreendimento para listar licenças (válidas ou em
        renovação), outorgas vigentes e usos insignificantes cadastrados em
        Documentos Ambientais.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <FormLabel>Atos autorizativos disponíveis</FormLabel>
        <FormDescription className="mt-1">
          Clique em Vincular para incluir no quadro abaixo. Licenças: válidas ou em renovação.
          Outorgas: apenas vigentes (válidas).
        </FormDescription>
      </div>

      <Tabs defaultValue="licencas" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto min-h-10">
          <TabsTrigger value="licencas" className="text-xs sm:text-sm py-2">
            Licenças ({licencas.length})
          </TabsTrigger>
          <TabsTrigger value="outorgas" className="text-xs sm:text-sm py-2">
            Outorgas ({outorgasVigentes.length})
          </TabsTrigger>
          <TabsTrigger value="usos" className="text-xs sm:text-sm py-2">
            Usos ({usos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="licencas" className="space-y-2 mt-3">
          {licencas.length > 0 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-9"
                onClick={() => vincularTodos('licenca', licencasAtos)}
              >
                Vincular todas as licenças listadas
              </Button>
              {licencas.map((l) => (
                <AtoListItem
                  key={l.id}
                  rotulo={formatLicencaRotulo(l)}
                  status={l.status}
                  linked={isAtoVinculado(value, 'licenca', l.id)}
                  onAdd={() =>
                    addAto({ tipo: 'licenca', id: l.id, rotulo: formatLicencaRotulo(l) })
                  }
                />
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              Nenhuma licença válida ou em renovação para este empreendimento.
            </p>
          )}
        </TabsContent>

        <TabsContent value="outorgas" className="space-y-2 mt-3">
          {outorgasVigentes.length > 0 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-9"
                onClick={() => vincularTodos('outorga', outorgasAtos)}
              >
                Vincular todas as outorgas vigentes
              </Button>
              {outorgasVigentes.map((o) => (
                <AtoListItem
                  key={o.id}
                  rotulo={formatOutorgaRotulo(o)}
                  status={o.status}
                  linked={isAtoVinculado(value, 'outorga', o.id)}
                  onAdd={() =>
                    addAto({ tipo: 'outorga', id: o.id, rotulo: formatOutorgaRotulo(o) })
                  }
                />
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              Nenhuma outorga vigente para este empreendimento.
            </p>
          )}
        </TabsContent>

        <TabsContent value="usos" className="space-y-2 mt-3">
          {usos.length > 0 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-9"
                onClick={() => vincularTodos('uso_insignificante', usosAtos)}
              >
                Vincular todos os usos listados
              </Button>
              {usos.map((u) => (
                <AtoListItem
                  key={u.id}
                  rotulo={formatUsoInsignificanteRotulo(u)}
                  status={u.status}
                  linked={isAtoVinculado(value, 'uso_insignificante', u.id)}
                  onAdd={() =>
                    addAto({
                      tipo: 'uso_insignificante',
                      id: u.id,
                      rotulo: formatUsoInsignificanteRotulo(u),
                    })
                  }
                />
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              Nenhum uso insignificante válido ou em renovação para este empreendimento.
            </p>
          )}
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
        <FormLabel>Vinculados a esta vistoria</FormLabel>
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum ato vinculado. A vistoria pode referir só observações no campo abaixo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {value.map((a) => (
              <li
                key={`${a.tipo}-${a.id}`}
                className="flex items-start gap-2 rounded-md border bg-background px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <Badge variant="secondary" className="mb-1 text-xs">
                    {TIPO_LABEL[a.tipo]}
                  </Badge>
                  <p className="text-sm leading-snug break-words">{a.rotulo}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-10 w-10"
                  aria-label="Remover vínculo"
                  onClick={() => removeAto(a.tipo, a.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
