'use client';

import * as React from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import type { Oficio } from '@/lib/types';
import {
  formatOficioNumberFromSequence,
  getNextOficioSequence,
  maxConcludedSequenceInYear,
} from '@/lib/oficio-counter';

type Props = {
  oficios: Oficio[] | undefined;
};

export function OficioCounterSettings({ oficios }: Props) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = React.useState(String(currentYear));
  const [lastUsedInput, setLastUsedInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const yearNum = parseInt(year, 10);
  const maxOnPlatform = maxConcludedSequenceInYear(oficios, yearNum);

  React.useEffect(() => {
    if (!firestore || !Number.isFinite(yearNum)) return;
    let cancelled = false;
    setLoading(true);
    getDoc(doc(firestore, 'oficioCounters', String(yearNum)))
      .then((snap) => {
        if (cancelled) return;
        const last = snap.exists() ? snap.data()?.lastSequence : undefined;
        setLastUsedInput(
          typeof last === 'number' && last >= 0 ? String(last) : maxOnPlatform > 0 ? String(maxOnPlatform) : '0',
        );
      })
      .catch(() => {
        if (!cancelled) setLastUsedInput(maxOnPlatform > 0 ? String(maxOnPlatform) : '0');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [firestore, yearNum, maxOnPlatform]);

  const parsedLast = parseInt(lastUsedInput, 10);
  const nextPreview =
    Number.isFinite(yearNum) && Number.isFinite(parsedLast) && parsedLast >= 0
      ? formatOficioNumberFromSequence(getNextOficioSequence(parsedLast), yearNum)
      : '—';

  async function handleSave() {
    if (!firestore || !user) return;
    if (!Number.isFinite(yearNum) || yearNum < 2000 || yearNum > 2100) {
      toast({ variant: 'destructive', title: 'Ano inválido' });
      return;
    }
    if (!Number.isFinite(parsedLast) || parsedLast < 0) {
      toast({
        variant: 'destructive',
        title: 'Valor inválido',
        description: 'Informe o último número já utilizado (0 se nenhum foi emitido).',
      });
      return;
    }
    if (parsedLast < maxOnPlatform) {
      toast({
        variant: 'destructive',
        title: 'Número abaixo do já usado na plataforma',
        description: `Já existem ofícios concluídos até ${String(maxOnPlatform).padStart(3, '0')}/${yearNum}. Use pelo menos ${maxOnPlatform}.`,
      });
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
        title: 'Contador atualizado',
        description: `Próximo ofício aprovado em ${yearNum}: ${nextPreview}.`,
      });
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

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Numeração anual (administrador)</CardTitle>
        <CardDescription>
          Concilie ofícios já encaminhados fora da plataforma. Informe o último número usado no ano;
          o próximo ofício aprovado receberá o número seguinte. Reverter um ofício concluído não
          altera o contador automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="oficio-counter-year">Ano</Label>
          <Input
            id="oficio-counter-year"
            className="w-28"
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </div>
        <div className="space-y-2 flex-1 min-w-[12rem]">
          <Label htmlFor="oficio-counter-last">Último nº já utilizado</Label>
          <Input
            id="oficio-counter-last"
            type="number"
            min={0}
            disabled={loading}
            value={lastUsedInput}
            onChange={(e) => setLastUsedInput(e.target.value)}
            placeholder="Ex: 14"
          />
          {maxOnPlatform > 0 && (
            <p className="text-xs text-muted-foreground">
              Na plataforma, o maior concluído em {yearNum} é{' '}
              {formatOficioNumberFromSequence(maxOnPlatform, yearNum)}.
            </p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Próximo ao aprovar</p>
          <p className="font-mono text-sm tabular-nums text-foreground">{loading ? '…' : nextPreview}</p>
        </div>
        <Button type="button" onClick={handleSave} disabled={saving || loading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar contador'}
        </Button>
      </CardContent>
    </Card>
  );
}
