'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { FinancialCenter, FinancialAllocation } from '@/lib/types';
import {
  computeCenterTotals,
  formatCurrencyBRL,
  getFinancialCenterTypeLabel,
  formatRoi,
} from '@/lib/financial-centers';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';

export default function RentabilidadePage() {
  const { firestore, user } = useFirebase();

  const centersQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_centers') : null),
    [firestore, user],
  );
  const { data: centers, isLoading } = useCollection<FinancialCenter>(centersQ);

  const allocQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_allocations') : null),
    [firestore, user],
  );
  const { data: allocations } = useCollection<FinancialAllocation>(allocQ);

  const rows = useMemo(() => {
    const allocs = allocations ?? [];
    return (centers ?? []).map((c) => ({
      center: c,
      totals: computeCenterTotals(c, allocs),
    }));
  }, [centers, allocations]);

  function exportCsv() {
    const header =
      'Nome;Tipo;Investimento;Retorno;Resultado;ROI%;Margem%;Saldo Caixa\n';
    const lines = rows.map(({ center, totals }) =>
      [
        center.name,
        getFinancialCenterTypeLabel(center.type),
        totals.investment,
        totals.returnAmount,
        totals.netResult,
        totals.roiPercent ?? '',
        totals.marginPercent ?? '',
        totals.cashBalance,
      ].join(';'),
    );
    const blob = new Blob([header + lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rentabilidade-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Rentabilidade e ROI"
        description="Indicadores gerenciais por centro. Não substituem contabilidade fiscal."
      >
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Por centro</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Centro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">Retorno</TableHead>
                  <TableHead className="text-right">Resultado</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Saldo caixa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ center, totals }) => (
                  <TableRow key={center.id}>
                    <TableCell>
                      <Link
                        href={`/financial/controle-projetos/centros/${center.id}`}
                        className="hover:underline"
                      >
                        {center.name}
                      </Link>
                    </TableCell>
                    <TableCell>{getFinancialCenterTypeLabel(center.type)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(totals.investment)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(totals.returnAmount)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        totals.netResult >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrencyBRL(totals.netResult)}
                    </TableCell>
                    <TableCell className="text-right">{formatRoi(totals.roiPercent)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(totals.cashBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
