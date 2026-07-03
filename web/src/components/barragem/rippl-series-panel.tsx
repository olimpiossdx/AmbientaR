'use client';

import * as React from 'react';
import { useFieldArray, type ArrayPath, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  criarSerieRipplMensalVazia,
  formatRipplMemorial,
  parseNumeroFormulario,
  ripplAnalise,
} from '@/lib/barragem/calculos';
import { ripplSeriesToInput } from '@/lib/barragem/barragem-rippl-export';
import type { RipplSerieMensalRow } from '@/lib/types';

export type RipplSeriesPanelPaths<T extends FieldValues> = {
  series: Path<T>;
  volumeUtil: Path<T>;
  memorial: Path<T>;
  demandaAnual?: Path<T>;
  /** Campos de capacidade para comparar com volume Rippl (primeiro valor numérico válido). */
  capacidadePaths?: Path<T>[];
};

type RipplSeriesPanelProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  paths: RipplSeriesPanelPaths<T>;
  title?: string;
  description?: string;
};

function readCapacidadeM3<T extends FieldValues>(
  form: UseFormReturn<T>,
  paths: Path<T>[] | undefined,
): number | null {
  if (!paths?.length) return null;
  for (const p of paths) {
    const v = parseNumeroFormulario(String(form.getValues(p) ?? ''));
    if (v != null && v > 0) return v;
  }
  return null;
}

export function RipplSeriesPanel<T extends FieldValues>({
  form,
  paths,
  title = 'Série mensal — método de Rippl',
  description = 'Informe vazões médias (m³/s) por mês. O sistema calcula volumes, saldos e o volume útil necessário (manual §5.5).',
}: RipplSeriesPanelProps<T>) {
  const { toast } = useToast();
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: paths.series as ArrayPath<T>,
  });

  React.useEffect(() => {
    const current = form.getValues(paths.series) as RipplSerieMensalRow[] | undefined;
    if (!current?.length) {
      replace(
        criarSerieRipplMensalVazia().map((p) => ({
          label: p.label,
          qAfluenteM3s: '',
          qDemandaM3s: '',
          diasNoPeriodo: String(p.diasNoPeriodo ?? 30),
          evapM3: '0',
        })) as never,
      );
    }
  }, [form, paths.series, replace]);

  const handleCalcular = () => {
    const rows = form.getValues(paths.series) as RipplSerieMensalRow[] | undefined;
    const periodos = ripplSeriesToInput(rows);
    if (!periodos.length) {
      toast({
        variant: 'destructive',
        title: 'Série incompleta',
        description: 'Informe vazões afluente e de demanda em pelo menos um mês.',
      });
      return;
    }

    const calc = ripplAnalise(periodos);
    const vUtil = calc.result.volumeUtilNecessario_m3;

    form.setValue(paths.volumeUtil, vUtil.toFixed(2) as never);
    form.setValue(paths.memorial, formatRipplMemorial(calc) as never);

    if (paths.demandaAnual) {
      const totalDem = calc.tabela.reduce((s, l) => s + l.vDemanda_m3, 0);
      form.setValue(paths.demandaAnual, totalDem.toFixed(2) as never);
    }

    const cap = readCapacidadeM3(form, paths.capacidadePaths);
    if (cap != null && cap < vUtil) {
      toast({
        title: 'Rippl calculado',
        description: `Volume útil necessário (${vUtil.toFixed(0)} m³) supera a capacidade declarada (${cap.toFixed(0)} m³).`,
      });
    } else if (calc.warnings.length) {
      toast({ title: 'Rippl calculado (revisar)', description: calc.warnings.join(' ') });
    } else {
      toast({
        title: 'Rippl calculado',
        description: `Volume útil necessário: ${vUtil.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m³`,
      });
    }
  };

  const volumeUtil = form.watch(paths.volumeUtil);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button type="button" variant="secondary" size="sm" className="shrink-0 gap-1" onClick={handleCalcular}>
          <Calculator className="h-4 w-4" />
          Calcular Rippl
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Mês</TableHead>
              <TableHead>Q afluente (m³/s)</TableHead>
              <TableHead>Q demanda (m³/s)</TableHead>
              <TableHead className="w-20">Dias</TableHead>
              <TableHead>Evap. (m³)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const labelPath = `${paths.series}.${index}.label` as Path<T>;
              const qAflPath = `${paths.series}.${index}.qAfluenteM3s` as Path<T>;
              const qDemPath = `${paths.series}.${index}.qDemandaM3s` as Path<T>;
              const diasPath = `${paths.series}.${index}.diasNoPeriodo` as Path<T>;
              const evapPath = `${paths.series}.${index}.evapM3` as Path<T>;
              return (
                <TableRow key={field.id}>
                  <TableCell className="font-medium text-muted-foreground">
                    {form.watch(labelPath) || index + 1}
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" {...form.register(qAflPath)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" {...form.register(qDemPath)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" {...form.register(diasPath)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" {...form.register(evapPath)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {volumeUtil ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Volume útil necessário (Rippl): <strong>{volumeUtil} m³</strong>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
