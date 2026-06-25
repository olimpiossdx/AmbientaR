'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  softDeleteFinancialTransaction,
  validateDeleteJustification,
} from '@/lib/financial-transaction-delete';
import type { Expense, Revenue } from '@/lib/types';

type Props = {
  item: Revenue | Expense;
  kind: 'revenue' | 'expense';
  disabled?: boolean;
};

export function DeleteRoiTransactionButton({
  item,
  kind,
  disabled,
}: Props) {
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [justification, setJustification] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  if (item.deletedAt) return null;

  async function handleConfirm() {
    if (!firestore || !auth) return;
    const validationError = validateDeleteJustification(justification);
    if (validationError) {
      toast({ variant: 'destructive', title: validationError });
      return;
    }
    setBusy(true);
    try {
      await softDeleteFinancialTransaction(
        firestore,
        auth,
        item,
        kind,
        justification,
      );
      toast({
        title: 'Lançamento excluído',
        description: 'O registro foi removido do extrato e não entra no caixa da empresa.',
      });
      setOpen(false);
      setJustification('');
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: e instanceof Error ? e.message : 'Tente novamente.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={disabled || busy}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Excluir
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o lançamento do extrato do projeto e do caixa operacional.
              O registro permanece no sistema com a justificativa informada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-justification">Justificativa (obrigatória)</Label>
            <Textarea
              id="delete-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Descreva o motivo da exclusão…"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void handleConfirm()}
            >
              {busy ? 'Excluindo…' : 'Confirmar exclusão'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
