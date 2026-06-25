'use client';

import * as React from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  formatGravityDamMemorial,
  gravityDamStability,
  gravityDamWeightFromSection,
  parseNumeroFormulario,
} from '@/lib/barragem/calculos';

export type BarragemConcretoGravidadeFormValues = {
  estabilidadeConcretoGravidade?: {
    alturaAguaM?: string;
    pesoEspecificoConcretoKNm3?: string;
    areaSecaoM2?: string;
    pesoProprioKN?: string;
    subpressaoKN?: string;
    areaBaseM2?: string;
    coesaoKpa?: string;
    anguloAtritoGrau?: string;
    bracoPesoM?: string;
    fsDeslizamento?: string;
    fsTombamento?: string;
    tensaoMediaKpa?: string;
    tensaoMaxKpa?: string;
    tensaoMinKpa?: string;
    memorial?: string;
  };
};

export type BarragemConcretoGravidadeFormApi = UseFormReturn<BarragemConcretoGravidadeFormValues>;

export function BarragemConcretoGravidadePanel({
  form,
}: {
  form: BarragemConcretoGravidadeFormApi;
}) {
  const { toast } = useToast();
  const prefix = 'estabilidadeConcretoGravidade' as const;

  React.useEffect(() => {
    if (!form.getValues(`${prefix}.pesoEspecificoConcretoKNm3`)) {
      form.setValue(`${prefix}.pesoEspecificoConcretoKNm3`, '24');
    }
  }, [form]);

  const handleCalcular = () => {
    const h = parseNumeroFormulario(form.getValues(`${prefix}.alturaAguaM`));
    const gammaC = parseNumeroFormulario(form.getValues(`${prefix}.pesoEspecificoConcretoKNm3`)) ?? 24;
    const area = parseNumeroFormulario(form.getValues(`${prefix}.areaSecaoM2`));
    const pesoManual = parseNumeroFormulario(form.getValues(`${prefix}.pesoProprioKN`));
    const W =
      pesoManual != null && pesoManual > 0
        ? pesoManual
        : area != null && area > 0
          ? gravityDamWeightFromSection(gammaC, area)
          : null;
    const U = parseNumeroFormulario(form.getValues(`${prefix}.subpressaoKN`)) ?? 0;
    const Ab = parseNumeroFormulario(form.getValues(`${prefix}.areaBaseM2`));
    const c = parseNumeroFormulario(form.getValues(`${prefix}.coesaoKpa`));
    const phi = parseNumeroFormulario(form.getValues(`${prefix}.anguloAtritoGrau`));
    const braco = parseNumeroFormulario(form.getValues(`${prefix}.bracoPesoM`));

    if (h == null || h <= 0) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Informe a altura da coluna d\'água (m).',
      });
      return;
    }
    if (W == null || W <= 0) {
      toast({
        variant: 'destructive',
        title: 'Peso próprio',
        description: 'Informe área da seção (m²) ou peso próprio (kN/m) diretamente.',
      });
      return;
    }
    if (Ab == null || c == null || phi == null || braco == null) {
      toast({
        variant: 'destructive',
        title: 'Parâmetros da base',
        description: 'Informe área da base, c′, φ′ e braço do peso (m).',
      });
      return;
    }

    if (pesoManual == null && area != null) {
      form.setValue(`${prefix}.pesoProprioKN`, W.toFixed(2));
    }

    const calc = gravityDamStability({
      alturaAguaM: h,
      pesoKN: W,
      subpressaoKN: U,
      areaBaseM2: Ab,
      coesaoKpa: c,
      anguloAtritoGrau: phi,
      bracoPesoM: braco,
    });

    form.setValue(`${prefix}.fsDeslizamento`, calc.result.fsDeslizamento.toFixed(3));
    form.setValue(`${prefix}.fsTombamento`, calc.result.fsTombamento.toFixed(3));
    form.setValue(`${prefix}.tensaoMediaKpa`, calc.result.tensaoMediaKpa.toFixed(1));
    form.setValue(`${prefix}.tensaoMaxKpa`, calc.result.tensaoMaxKpa.toFixed(1));
    form.setValue(`${prefix}.tensaoMinKpa`, calc.result.tensaoMinKpa.toFixed(1));
    form.setValue(`${prefix}.memorial`, formatGravityDamMemorial(calc));

    if (calc.status === 'nao_atende') {
      const tensaoMsg =
        calc.result.tensaoMinKpa < 0
          ? ` Tração na base (σ_mín = ${calc.result.tensaoMinKpa.toFixed(0)} kPa).`
          : '';
      toast({
        variant: 'destructive',
        title: 'Critério preliminar não atendido',
        description: `FS_d = ${calc.result.fsDeslizamento.toFixed(2)}; FS_t = ${calc.result.fsTombamento.toFixed(2)}.${tensaoMsg}`,
      });
    } else {
      toast({
        title: 'Estabilidade calculada',
        description: `FS_d = ${calc.result.fsDeslizamento.toFixed(3)} · FS_t = ${calc.result.fsTombamento.toFixed(3)} · σ_máx = ${calc.result.tensaoMaxKpa.toFixed(0)} kPa`,
      });
    }
  };

  const fsD = form.watch(`${prefix}.fsDeslizamento`);
  const fsT = form.watch(`${prefix}.fsTombamento`);
  const sigmaMax = form.watch(`${prefix}.tensaoMaxKpa`);
  const sigmaMin = form.watch(`${prefix}.tensaoMinKpa`);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">Concreto gravidade — FS e tensões na base</CardTitle>
          <CardDescription>
            Triagem §9.4–9.6 (deslizamento, tombamento e σ = W′/A_b ± M/S). Não substitui projeto
            estrutural com combinações de cargas e sismo.
          </CardDescription>
        </div>
        <Button type="button" variant="secondary" size="sm" className="shrink-0 gap-1" onClick={handleCalcular}>
          <Calculator className="h-4 w-4" />
          Calcular FS
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Altura d&apos;água h (m)</Label>
            <Input {...form.register(`${prefix}.alturaAguaM`)} placeholder="ex. 12" />
          </div>
          <div className="space-y-2">
            <Label>γ_c concreto (kN/m³)</Label>
            <Input {...form.register(`${prefix}.pesoEspecificoConcretoKNm3`)} placeholder="24" />
          </div>
          <div className="space-y-2">
            <Label>Área seção A (m²/m)</Label>
            <Input {...form.register(`${prefix}.areaSecaoM2`)} placeholder="ex. 80" />
          </div>
          <div className="space-y-2">
            <Label>W (kN/m) — opcional</Label>
            <Input {...form.register(`${prefix}.pesoProprioKN`)} placeholder="ou calc. γ_c·A" />
          </div>
          <div className="space-y-2">
            <Label>Subpressão U (kN/m)</Label>
            <Input {...form.register(`${prefix}.subpressaoKN`)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Área base A_b (m²/m)</Label>
            <Input {...form.register(`${prefix}.areaBaseM2`)} placeholder="ex. 15" />
          </div>
          <div className="space-y-2">
            <Label>c′ base (kPa)</Label>
            <Input {...form.register(`${prefix}.coesaoKpa`)} placeholder="ex. 50" />
          </div>
          <div className="space-y-2">
            <Label>φ′ base (°)</Label>
            <Input {...form.register(`${prefix}.anguloAtritoGrau`)} placeholder="ex. 35" />
          </div>
          <div className="space-y-2">
            <Label>Braço do peso (m)</Label>
            <Input {...form.register(`${prefix}.bracoPesoM`)} placeholder="ex. 8" />
          </div>
          <div className="space-y-2">
            <Label>FS deslizamento</Label>
            <Input value={fsD ?? ''} readOnly className="bg-muted/50 font-medium" placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label>FS tombamento</Label>
            <Input value={fsT ?? ''} readOnly className="bg-muted/50 font-medium" placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label>σ_máx (kPa)</Label>
            <Input value={sigmaMax ?? ''} readOnly className="bg-muted/50 font-medium" placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label>σ_mín (kPa)</Label>
            <Input value={sigmaMin ?? ''} readOnly className="bg-muted/50 font-medium" placeholder="—" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
