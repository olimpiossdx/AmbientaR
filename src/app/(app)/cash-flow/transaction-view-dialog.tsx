'use client';

import type { Expense, Revenue } from '@/lib/types';
import { RecordViewDialog } from '@/components/shared/record-view-dialog';

type TransactionViewDialogProps = {
  item: Revenue | Expense;
  type: 'Receita' | 'Despesa';
  clientName?: string;
};

export function TransactionViewDialog({ item, type, clientName }: TransactionViewDialogProps) {
  const formattedDate = new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(item.amount);

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
    </RecordViewDialog>
  );
}
