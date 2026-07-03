'use client';

import * as React from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  BISHOP_CENARIOS,
  bishopSimplified,
  formatBishopMemorial,
  morgensternPriceHalfSine,
  formatMorgensternPriceMemorial,
  parseNumeroFormulario,
  type BishopCenario,
  type BishopFatiaInput,
} from '@/lib/barragem/calculos';

export type BarragemGeotecniaFatiaRow = {
  label?: string;
  larguraM?: string;
  pesoKN?: string;
  anguloBaseGrau?: string;
  ubKN?: string;
};

export type BarragemGeotecniaFormValues = {
  estabilidadeTaludes?: {
    metodoCalculo?: 'bishop' | 'morgenstern_price';
    cenario?: BishopCenario;
    coesaoKpa?: string;
    anguloAtritoGrau?: string;
    fatorSeguranca?: string;
    lambdaMorgenstern?: string;
    memorial?: string;
    fatias?: BarragemGeotecniaFatiaRow[];
  };
};

export type BarragemGeotecniaFormApi = UseFormReturn<BarragemGeotecniaFormValues>;

function fatiasFromForm(rows: BarragemGeotecniaFatiaRow[] | undefined): BishopFatiaInput[] {
  if (!rows?.length) return [];
  return rows
    .map((r, i) => ({
      label: r.label || `Fatia ${i + 1}`,
      larguraM: parseNumeroFormulario(r.larguraM) ?? 0,
      pesoKN: parseNumeroFormulario(r.pesoKN) ?? 0,
      anguloBaseGrau: parseNumeroFormulario(r.anguloBaseGrau) ?? 0,
      ubKN: parseNumeroFormulario(r.ubKN) ?? 0,
    }))
    .filter((f) => f.larguraM > 0 && f.pesoKN > 0);
}

const FATIAS_PADRAO = Array.from({ length: 5 }, (_, i) => ({
  label: `F${i + 1}`,
  larguraM: '',
  pesoKN: '',
  anguloBaseGrau: '',
  ubKN: '0',
}));

export function BarragemGeotecniaPanel({ form }: { form: BarragemGeotecniaFormApi }) {
  const { toast } = useToast();
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'estabilidadeTaludes.fatias',
  });

  React.useEffect(() => {
    const current = form.getValues('estabilidadeTaludes.fatias');
    if (!current?.length) {
      replace(FATIAS_PADRAO);
    }
    if (!form.getValues('estabilidadeTaludes.cenario')) {
      form.setValue('estabilidadeTaludes.cenario', 'operacao_normal');
    }
    if (!form.getValues('estabilidadeTaludes.metodoCalculo')) {
      form.setValue('estabilidadeTaludes.metodoCalculo', 'bishop');
    }
  }, [form, replace]);

  const metodo = form.watch('estabilidadeTaludes.metodoCalculo') || 'bishop';

  const handleCalcular = () => {
    const c = parseNumeroFormulario(form.getValues('estabilidadeTaludes.coesaoKpa'));
    const phi = parseNumeroFormulario(form.getValues('estabilidadeTaludes.anguloAtritoGrau'));
    const cenario =
      (form.getValues('estabilidadeTaludes.cenario') as BishopCenario) || 'operacao_normal';
    const fatias = fatiasFromForm(form.getValues('estabilidadeTaludes.fatias'));
    const metodoCalc =
      form.getValues('estabilidadeTaludes.metodoCalculo') || 'bishop';

    if (c == null || phi == null) {
      toast({
        variant: 'destructive',
        title: 'Parâmetros incompletos',
        description: 'Informe coesão (kPa) e ângulo de atrito (°).',
      });
      return;
    }
    if (!fatias.length) {
      toast({
        variant: 'destructive',
        title: 'Fatias incompletas',
        description: 'Preencha largura, peso e ângulo em pelo menos uma fatia.',
      });
      return;
    }

    const crit = BISHOP_CENARIOS.find((x) => x.value === cenario);

    if (metodoCalc === 'morgenstern_price') {
      const calc = morgensternPriceHalfSine(fatias, c, phi, cenario);
      const FS = calc.result.FS;
      form.setValue('estabilidadeTaludes.fatorSeguranca', FS.toFixed(3));
      form.setValue('estabilidadeTaludes.lambdaMorgenstern', calc.result.lambda.toFixed(4));
      form.setValue('estabilidadeTaludes.memorial', formatMorgensternPriceMemorial(calc, fatias));

      if (calc.status === 'nao_atende') {
        toast({
          variant: 'destructive',
          title: 'FS abaixo do critério preliminar',
          description: `FS = ${FS.toFixed(2)} (mín. ${crit?.fsMin ?? 1.5} — ${crit?.label}).`,
        });
      } else {
        toast({
          title: 'Morgenstern-Price calculado',
          description: `FS = ${FS.toFixed(3)} · λ = ${calc.result.lambda.toFixed(3)}`,
        });
      }
      return;
    }

    const calc = bishopSimplified(fatias, c, phi, cenario);
    const FS = calc.result.FS;
    form.setValue('estabilidadeTaludes.fatorSeguranca', FS.toFixed(3));
    form.setValue('estabilidadeTaludes.lambdaMorgenstern', '');
    form.setValue('estabilidadeTaludes.memorial', formatBishopMemorial(calc, fatias));

    if (calc.status === 'nao_atende') {
      toast({
        variant: 'destructive',
        title: 'FS abaixo do critério preliminar',
        description: `FS = ${FS.toFixed(2)} (mín. ${crit?.fsMin ?? 1.5} — ${crit?.label}).`,
      });
    } else if (calc.warnings.length) {
      toast({ title: `FS = ${FS.toFixed(2)}`, description: calc.warnings.join(' ') });
    } else {
      toast({
        title: 'Bishop calculado',
        description: `FS = ${FS.toFixed(3)} — ${crit?.label ?? cenario}`,
      });
    }
  };

  const fs = form.watch('estabilidadeTaludes.fatorSeguranca');
  const lambda = form.watch('estabilidadeTaludes.lambdaMorgenstern');

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">Triagem geotécnica — método das fatias</CardTitle>
          <CardDescription>
            Bishop simplificado ou Morgenstern-Price (meia-seno) — manual §8.4. Resultado preliminar.
          </CardDescription>
        </div>
        <Button type="button" variant="secondary" size="sm" className="shrink-0 gap-1" onClick={handleCalcular}>
          <Calculator className="h-4 w-4" />
          Calcular FS
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Método</Label>
            <Select
              value={metodo}
              onValueChange={(v) =>
                form.setValue('estabilidadeTaludes.metodoCalculo', v as 'bishop' | 'morgenstern_price')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bishop">Bishop simplificado</SelectItem>
                <SelectItem value="morgenstern_price">Morgenstern-Price (meia-seno)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cenário</Label>
            <Select
              value={form.watch('estabilidadeTaludes.cenario') || 'operacao_normal'}
              onValueChange={(v) => form.setValue('estabilidadeTaludes.cenario', v as BishopCenario)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BISHOP_CENARIOS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label} (FS ≥ {c.fsMin}
                    {c.fsMax ? `–${c.fsMax}` : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>c′ (kPa)</Label>
            <Input {...form.register('estabilidadeTaludes.coesaoKpa')} placeholder="ex. 10" />
          </div>
          <div className="space-y-2">
            <Label>φ′ (°)</Label>
            <Input {...form.register('estabilidadeTaludes.anguloAtritoGrau')} placeholder="ex. 28" />
          </div>
          <div className="space-y-2">
            <Label>FS calculado</Label>
            <Input
              value={fs ?? ''}
              readOnly
              className="bg-muted/50 font-medium"
              placeholder="—"
            />
          </div>
          {metodo === 'morgenstern_price' && (
            <div className="space-y-2 md:col-span-2">
              <Label>λ (Morgenstern-Price)</Label>
              <Input
                value={lambda ?? ''}
                readOnly
                className="bg-muted/50 font-medium"
                placeholder="—"
              />
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>b (m)</TableHead>
                <TableHead>W (kN/m)</TableHead>
                <TableHead>α base (°)</TableHead>
                <TableHead>u·b (kN/m)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="text-muted-foreground">
                    {form.watch(`estabilidadeTaludes.fatias.${index}.label`) || index + 1}
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      {...form.register(`estabilidadeTaludes.fatias.${index}.larguraM`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      {...form.register(`estabilidadeTaludes.fatias.${index}.pesoKN`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      {...form.register(`estabilidadeTaludes.fatias.${index}.anguloBaseGrau`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      {...form.register(`estabilidadeTaludes.fatias.${index}.ubKN`)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
