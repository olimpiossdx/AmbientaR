'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Expense, Revenue } from '@/lib/types';

const TransactionForm = dynamic(
  () =>
    import('@/app/(app)/cash-flow/transaction-form').then((m) => ({
      default: m.TransactionForm,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

type Props = {
  item: Revenue | Expense;
  kind: 'revenue' | 'expense';
  caseId: string;
  defaultContractId?: string;
  defaultClientId?: string;
  defaultProjectId?: string;
  disabled?: boolean;
};

export function EditRoiTransactionButton({
  item,
  kind,
  caseId,
  defaultContractId,
  defaultClientId,
  defaultProjectId,
  disabled,
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  if (item.deletedAt) return null;

  const title = kind === 'revenue' ? 'Editar receita' : 'Editar despesa';
  const description =
    kind === 'revenue'
      ? 'Atualize o lançamento gerencial ou anexe o comprovante de recebimento.'
      : 'Atualize o lançamento gerencial ou anexe o comprovante de pagamento.';

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4 mr-1" />
        Editar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <TransactionForm
            key={`${kind}-${item.id}-${open ? 'open' : 'closed'}`}
            transactionType={kind}
            currentItem={item}
            defaultProjectRoiCaseId={caseId}
            defaultContractId={defaultContractId}
            defaultClientId={defaultClientId}
            defaultProjectId={defaultProjectId}
            onSuccess={() => {
              toast({
                title: 'Lançamento atualizado',
                description: 'As alterações foram salvas neste caso.',
              });
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
