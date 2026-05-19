'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { FinancialAssetSale } from '@/lib/types';
import {
  formatCurrencyBRL,
  computeAssetSaleReceived,
  computeAssetSaleOutstanding,
  deriveAssetSaleStatus,
} from '@/lib/financial-centers';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const STATUS_LABEL: Record<string, string> = {
  open: 'Em aberto',
  partial: 'Parcial',
  settled: 'Quitado',
  cancelled: 'Cancelado',
};

export default function VendasAtivosPage() {
  const { firestore, user } = useFirebase();

  const salesQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_asset_sales') : null),
    [firestore, user],
  );
  const { data: sales, isLoading } = useCollection<FinancialAssetSale>(salesQ);

  const rows = useMemo(() => {
    return (sales ?? []).map((s) => ({
      sale: s,
      status: deriveAssetSaleStatus(s),
      received: computeAssetSaleReceived(s),
      outstanding: computeAssetSaleOutstanding(s),
    }));
  }, [sales]);

  return (
    <>
      <PageHeader
        title="Vendas de ativos"
        description="Veículos, ferramentas e equipamentos — dinheiro ou permuta em serviços."
      >
        <Button asChild>
          <Link href="/financial/controle-projetos/ativos/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova venda
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Vendas registadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                  <TableHead className="text-right">Em aberto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Nenhuma venda. Registe a primeira venda de ativo.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(({ sale, status, received, outstanding }) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <Link
                          href={`/financial/controle-projetos/ativos/${sale.id}`}
                          className="font-medium hover:underline"
                        >
                          {sale.description}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status === 'settled' ? 'default' : 'secondary'}>
                          {STATUS_LABEL[status] ?? status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyBRL(sale.totalValue)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        {formatCurrencyBRL(received)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyBRL(outstanding)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
