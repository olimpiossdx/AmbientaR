'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import type { FinancialAssetSale, AssetInstallment } from '@/lib/types';
import {
  formatCurrencyBRL,
  computeAssetSaleReceived,
  computeAssetSaleOutstanding,
  deriveAssetSaleStatus,
} from '@/lib/financial-centers';
import {
  appendFinancialMovement,
  createAllocationWithMovement,
} from '@/lib/financial-ledger';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { logUserAction } from '@/lib/audit-log';

export default function VendaAtivoDetailPage() {
  const params = useParams();
  const saleId = params.id as string;
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const [sale, setSale] = useState<FinancialAssetSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingSeq, setPayingSeq] = useState<number | null>(null);

  useEffect(() => {
    if (!firestore || !saleId) return;
    getDoc(doc(firestore, 'financial_asset_sales', saleId)).then((snap) => {
      if (snap.exists()) setSale({ id: snap.id, ...snap.data() } as FinancialAssetSale);
      setLoading(false);
    });
  }, [firestore, saleId]);

  const received = sale ? computeAssetSaleReceived(sale) : 0;
  const outstanding = sale ? computeAssetSaleOutstanding(sale) : 0;
  const total = sale ? Number(sale.totalValue) || 0 : 0;
  const pct = total > 0 ? Math.min(100, (received / total) * 100) : 0;
  const status = sale ? deriveAssetSaleStatus(sale) : 'open';

  async function settleInstallment(inst: AssetInstallment) {
    if (!firestore || !auth?.currentUser || !sale || sale.status === 'settled') return;
    setPayingSeq(inst.seq);
    const uid = auth.currentUser.uid;
    const now = new Date().toISOString();
    const date = now.slice(0, 10);

    try {
      if (inst.kind === 'cash') {
        const revRef = await addDoc(collection(firestore, 'revenues'), {
          description: `Parcela ${inst.seq} — ${sale.description}`,
          amount: inst.amount,
          date: now,
          clientId: sale.counterpartyType === 'client' ? sale.counterpartyId : undefined,
        });
        await createAllocationWithMovement(
          firestore,
          {
            centerId: sale.centerId,
            sourceType: 'revenue',
            sourceId: revRef.id,
            amount: inst.amount,
            direction: 'credit',
            date,
            description: `Parcela ${inst.seq} venda ativo`,
            createdAt: now,
            createdBy: uid,
          },
          `Parcela ${inst.seq} recebida`,
        );
        await appendFinancialMovement(firestore, {
          date,
          kind: 'asset_installment_in',
          direction: 'in',
          amount: inst.amount,
          description: `Parcela ${inst.seq} (dinheiro): ${sale.description}`,
          centerId: sale.centerId,
          assetSaleId: sale.id,
          sourceCollection: 'revenues',
          sourceId: revRef.id,
          createdAt: now,
          createdBy: uid,
        });
        inst.revenueId = revRef.id;
      } else {
        const alloc = await createAllocationWithMovement(
          firestore,
          {
            centerId: sale.centerId,
            sourceType: 'barter_credit',
            sourceId: `${sale.id}-inst-${inst.seq}`,
            amount: inst.amount,
            direction: 'credit',
            date,
            settlementKind:
              sale.counterpartyType === 'client' ? 'barter_client' : 'barter_supplier',
            description: `Permuta parcela ${inst.seq}`,
            createdAt: now,
            createdBy: uid,
          },
          `Permuta parcela ${inst.seq}`,
        );
        await appendFinancialMovement(firestore, {
          date,
          kind: 'asset_barter_in',
          direction: 'in',
          amount: inst.amount,
          description: `Permuta parcela ${inst.seq}: ${sale.description}`,
          centerId: sale.centerId,
          assetSaleId: sale.id,
          createdAt: now,
          createdBy: uid,
        });
        inst.barterAllocationId = alloc.allocationId;
      }

      const installments = sale.installments.map((i) =>
        i.seq === inst.seq ? { ...i, status: 'paid' as const, ...inst } : i,
      );
      const newReceived = installments
        .filter((i) => i.status === 'paid')
        .reduce((a, i) => a + i.amount, 0);
      const newStatus =
        newReceived >= total - 0.005 ? 'settled' : newReceived > 0 ? 'partial' : 'open';

      await updateDoc(doc(firestore, 'financial_asset_sales', sale.id), {
        installments,
        status: newStatus,
        updatedAt: now,
      });

      if (newStatus === 'settled') {
        await appendFinancialMovement(firestore, {
          date,
          kind: 'asset_settled',
          direction: 'in',
          amount: 0,
          description: `Quitação total: ${sale.description}`,
          centerId: sale.centerId,
          assetSaleId: sale.id,
          locked: true,
          createdAt: now,
          createdBy: uid,
        });
        await updateDoc(doc(firestore, 'financial_centers', sale.centerId), {
          status: 'closed',
          updatedAt: now,
        });
      }

      setSale({ ...sale, installments, status: newStatus });
      await logUserAction(firestore, auth, 'settle_asset_installment', {
        saleId: sale.id,
        seq: inst.seq,
      });
      toast({ title: 'Parcela quitada' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setPayingSeq(null);
    }
  }

  if (loading || !sale) {
    return (
      <>
        <PageHeader title="Venda de ativo" />
        <Skeleton className="h-64 w-full" />
      </>
    );
  }

  return (
    <>
      <PageHeader title={sale.description} description={`Venda de ativo — ${status}`}>
        <Button variant="outline" asChild>
          <Link href={`/financial/controle-projetos/centros/${sale.centerId}`}>
            Ver centro
          </Link>
        </Button>
      </PageHeader>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Progresso da quitação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={pct} className="h-3" />
          <div className="flex justify-between text-sm">
            <span>Recebido: {formatCurrencyBRL(received)}</span>
            <span>Total: {formatCurrencyBRL(total)}</span>
            <span>Em aberto: {formatCurrencyBRL(outstanding)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cronograma</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.installments.map((inst) => (
                <TableRow key={inst.seq}>
                  <TableCell>{inst.seq}</TableCell>
                  <TableCell>{inst.dueDate}</TableCell>
                  <TableCell>{inst.kind === 'cash' ? 'Dinheiro' : 'Permuta'}</TableCell>
                  <TableCell>
                    <Badge variant={inst.status === 'paid' ? 'default' : 'secondary'}>
                      {inst.status === 'paid' ? 'Quitada' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrencyBRL(inst.amount)}</TableCell>
                  <TableCell className="text-right">
                    {inst.status === 'pending' && status !== 'settled' && (
                      <Button
                        size="sm"
                        disabled={payingSeq !== null}
                        onClick={() => settleInstallment(inst)}
                      >
                        {payingSeq === inst.seq ? '…' : 'Quitar'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
