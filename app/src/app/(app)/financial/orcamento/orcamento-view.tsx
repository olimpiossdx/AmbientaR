'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { EXPENSE_CATEGORIES, formatCurrencyBRL } from '@/lib/financial-core';
import { useToast } from '@/hooks/use-toast';

const currentYear = new Date().getFullYear();

type BudgetDoc = {
  year: number;
  metas: Record<string, number>;
  updatedAt: string;
};

export function OrcamentoView() {
  const [year, setYear] = useState(String(currentYear));
  const [metas, setMetas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore || !user) {
      setLoadingDoc(false);
      return;
    }
    let cancelled = false;
    setLoadingDoc(true);
    void (async () => {
      try {
        const snap = await getDoc(doc(firestore, 'financial_budgets', year));
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data() as BudgetDoc;
          setMetas(data.metas || {});
        } else {
          const initial: Record<string, number> = {};
          EXPENSE_CATEGORIES.forEach((c) => {
            initial[c.value] = 0;
          });
          initial.receita_meta = 0;
          setMetas(initial);
        }
      } catch {
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar orçamento',
            description: 'Tente novamente ou verifique permissões.',
          });
        }
      } finally {
        if (!cancelled) setLoadingDoc(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firestore, user, year, toast]);

  const save = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      await setDoc(doc(firestore, 'financial_budgets', year), {
        year: Number(year),
        metas,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Orçamento salvo' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao salvar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Orçamento Anual">
        <Input
          type="number"
          className="w-24"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <Button onClick={() => void save()} disabled={loading || loadingDoc}>
          {loadingDoc ? 'Carregando…' : 'Salvar'}
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Metas {year}</CardTitle>
            <CardDescription>
              Defina metas anuais por categoria de despesa e receita. Compare com o realizado na DRE e no Painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <div>
              <Label>Meta de receita bruta</Label>
              <Input
                type="number"
                value={metas.receita_meta ?? 0}
                onChange={(e) =>
                  setMetas((m) => ({ ...m, receita_meta: Number(e.target.value) || 0 }))
                }
              />
            </div>
            {EXPENSE_CATEGORIES.map((c) => (
              <div key={c.value}>
                <Label>Meta despesa — {c.label}</Label>
                <Input
                  type="number"
                  value={metas[c.value] ?? 0}
                  onChange={(e) =>
                    setMetas((m) => ({ ...m, [c.value]: Number(e.target.value) || 0 }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrencyBRL(metas[c.value] ?? 0)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
