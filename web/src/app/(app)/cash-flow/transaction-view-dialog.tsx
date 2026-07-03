'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Expense, Revenue } from '@/lib/types';
import { RecordViewDialog } from '@/components/shared/record-view-dialog';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { createTransactionEstorno, isTransactionEstornada } from '@/lib/project-roi-estorno';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

type TransactionViewDialogProps = {
  item: Revenue | Expense;
  type: 'Receita' | 'Despesa';
  clientName?: string;
  collectionKind: 'revenue' | 'expense';
};

export function TransactionViewDialog({
  item,
  type,
  clientName,
  collectionKind,
}: TransactionViewDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [estornando, setEstornando] = React.useState(false);

  const revenuesQ = useMemoFirebase(
    () => (firestore ? collection(firestore, 'revenues') : null),
    [firestore],
  );
  const expensesQ = useMemoFirebase(
    () => (firestore ? collection(firestore, 'expenses') : null),
    [firestore],
  );
  const { data: revenues } = useCollection<Revenue>(revenuesQ);
  const { data: expenses } = useCollection<Expense>(expensesQ);

  const jaEstornada =
    revenues && expenses
      ? isTransactionEstornada(item, revenues, expenses)
      : Boolean(item.estornadoPorId);

  const formattedDate = new Date(item.date).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
  });
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(item.amount);

  async function handleEstorno() {
    if (!firestore || jaEstornada || item.isEstorno) return;
    setEstornando(true);
    try {
      await createTransactionEstorno(firestore, item, collectionKind);
      toast({
        title: 'Estorno registrado',
        description: 'O lançamento original foi neutralizado no ROI do projeto.',
      });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro ao estornar' });
    } finally {
      setEstornando(false);
    }
  }

  return (
    <RecordViewDialog
      title={`Visualizar ${type}`}
      description="Consulte os dados do lançamento sem editar."
      fileUrl={item.fileUrl}
      labels={{
        zoomTitle: 'Anexo do lançamento',
        zoomDescription: 'Visualização ampliada do arquivo.',
        attachmentEmpty: 'Sem anexo neste lançamento.',
      }}
      triggerLabel="Visualizar lançamento"
      footer={
        <div className="flex flex-wrap gap-2 justify-end w-full">
          {item.projectRoiCaseId && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/financial/projetos-roi/${item.projectRoiCaseId}`}>
                Ver caso ROI
              </Link>
            </Button>
          )}
          {!item.isEstorno && !jaEstornada && (
            <Button
              variant="destructive"
              size="sm"
              disabled={estornando}
              onClick={() => void handleEstorno()}
            >
              {estornando ? 'Estornando…' : 'Estornar'}
            </Button>
          )}
        </div>
      }
    >
      <div>
        <p className="text-muted-foreground">Descrição</p>
        <p className="font-medium">{item.description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p className="text-muted-foreground">Data</p>
          <p className="font-medium">{formattedDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Valor</p>
          <p
            className={`font-semibold ${type === 'Receita' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}
          >
            {formattedAmount}
          </p>
        </div>
      </div>
      {clientName && (
        <div>
          <p className="text-muted-foreground">Cliente</p>
          <p className="font-medium">{clientName}</p>
        </div>
      )}
      {item.projectRoiCaseId && (
        <div>
          <p className="text-muted-foreground">Caso Projetos & ROI</p>
          <p className="font-medium text-xs">{item.projectRoiCaseId}</p>
        </div>
      )}
      {(item.isEstorno || jaEstornada) && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          {item.isEstorno
            ? 'Este lançamento é um estorno.'
            : 'Lançamento original já estornado.'}
        </p>
      )}
    </RecordViewDialog>
  );
}
