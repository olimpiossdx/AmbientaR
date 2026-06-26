'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  rationalMethod,
  kirpichTc,
  spillwayWidth,
  formatCalculoMemorial,
  parseNumeroFormulario,
} from '@/lib/barragem/calculos';

export type CalculosFormApi = {
  getValues: (name: string) => unknown;
  setValue: (name: string, value: string) => void;
};

export function BarragemCalculosPanel({ form }: { form: CalculosFormApi }) {
  const { toast } = useToast();
  const [areaKm2, setAreaKm2] = React.useState('');
  const [Lkm, setLkm] = React.useState('');
  const [Hm, setHm] = React.useState('');
  const [Cd, setCd] = React.useState('1,8');
  const [Hcarga, setHcarga] = React.useState('');

  const appendOrReplaceMemorial = (field: string, text: string) => {
    const current = String(form.getValues(`calculosHidrologicos.${field}`) ?? '');
    const sep = current.trim() ? '\n\n' : '';
    form.setValue(`calculosHidrologicos.${field}`, `${current}${sep}${text}`);
  };

  const handleRacional = () => {
    const C = parseNumeroFormulario(
      String(form.getValues('calculosHidrologicos.coeficienteEscoamento') ?? ''),
    );
    const I = parseNumeroFormulario(
      String(form.getValues('calculosHidrologicos.intensidadeChuva') ?? ''),
    );
    const A = parseNumeroFormulario(areaKm2);
    if (C == null || I == null || A == null) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Informe C e I nos campos 9.3/9.4 e área da bacia (km²) na calculadora.',
      });
      return;
    }
    const calc = rationalMethod(C, I, A);
    appendOrReplaceMemorial('vazaoCheia', formatCalculoMemorial('Vazão de pico — método racional', calc));
    toast({ title: 'Vazão calculada', description: `${calc.result.Q_m3s.toFixed(2)} m³/s` });
  };

  const handleKirpich = () => {
    const L = parseNumeroFormulario(Lkm);
    const H = parseNumeroFormulario(Hm);
    if (L == null || H == null) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Informe L (km) e H (m) na calculadora.',
      });
      return;
    }
    const calc = kirpichTc(L, H);
    appendOrReplaceMemorial(
      'tempoConcentracao',
      formatCalculoMemorial('Tempo de concentração — Kirpich', calc),
    );
    toast({ title: 'Tc calculado', description: `${calc.result.Tc_min.toFixed(1)} min` });
  };

  const handleVertedouro = () => {
    const Qtext = String(form.getValues('calculosHidrologicos.vazaoCheia') ?? '');
    const Qmatch = Qtext.match(/([\d.,]+)\s*m³\/s/i);
    const Q = Qmatch
      ? parseNumeroFormulario(Qmatch[1])
      : parseNumeroFormulario(Qtext);
    const cd = parseNumeroFormulario(Cd);
    const H = parseNumeroFormulario(Hcarga);
    if (Q == null || cd == null || H == null) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Calcule ou informe a vazão (9.5), Cd e carga H na calculadora.',
      });
      return;
    }
    const calc = spillwayWidth(Q, cd, H);
    const current = String(form.getValues('extravasor') ?? '');
    const sep = current.trim() ? '\n\n' : '';
    form.setValue(
      'extravasor',
      `${current}${sep}${formatCalculoMemorial('Largura preliminar do vertedouro', calc)}`,
    );
    toast({ title: 'Largura calculada', description: `${calc.result.L_m.toFixed(2)} m` });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Calculadora hidráulica</CardTitle>
        <CardDescription>
          Preenche os memoriais 9.2, 9.5 e 11 com fórmulas do manual técnico. Resultados são
          preliminares — revisão do RT obrigatória.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="calc-area">Área bacia (km²)</Label>
            <Input id="calc-area" value={areaKm2} onChange={(e) => setAreaKm2(e.target.value)} placeholder="5" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="calc-L">Talvegue L (km)</Label>
            <Input id="calc-L" value={Lkm} onChange={(e) => setLkm(e.target.value)} placeholder="2,5" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="calc-H">Desnível H (m)</Label>
            <Input id="calc-H" value={Hm} onChange={(e) => setHm(e.target.value)} placeholder="150" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="calc-Cd">Cd vertedouro</Label>
            <Input id="calc-Cd" value={Cd} onChange={(e) => setCd(e.target.value)} placeholder="1,8" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="calc-Hcarga">Carga H vertedouro (m)</Label>
            <Input id="calc-Hcarga" value={Hcarga} onChange={(e) => setHcarga(e.target.value)} placeholder="1,2" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleKirpich}>
            Calcular Tc (9.2)
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleRacional}>
            Calcular Qp racional (9.5)
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleVertedouro}>
            Calcular largura vertedouro (11)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
