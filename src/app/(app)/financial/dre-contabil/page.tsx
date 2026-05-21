'use client';

import * as React from 'react';
import { useMemo, useState, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Invoice, Revenue, Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2, TrendingUp, TrendingDown, Minus, FileDown, Printer, Link2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  guardBrandingPdfExport,
  reportBrandingPdfIssues,
} from '@/lib/pdf-branding-layout';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { useFinancialMenuDebug } from '@/lib/financial-menu-debug';
import {
  calculateDre,
  formatCurrencyBRL,
  type DreRevenueRegime,
} from '@/lib/financial-core';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const formatCurrency = formatCurrencyBRL;

const DRE_REGIME_LABELS: Record<DreRevenueRegime, string> = {
  faturas_pagas: 'Somente faturas pagas',
  caixa: 'Somente receitas de caixa',
  combinado_sem_duplicar: 'Faturas pagas + caixa sem vínculo (recomendado)',
};

export default function DreContabilPage() {
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [revenueRegime, setRevenueRegime] = useState<DreRevenueRegime>('combinado_sem_duplicar');
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const invoicesQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'invoices') : null),
    [firestore, user]
  );
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

  const revenuesQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'revenues') : null),
    [firestore, user]
  );
  const { data: revenues, isLoading: isLoadingRevenues } = useCollection<Revenue>(revenuesQuery);

  const expensesQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'expenses') : null),
    [firestore, user]
  );
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const dre = useMemo(() => {
    const year = parseInt(selectedYear, 10);
    if (Number.isNaN(year) || !invoices || !revenues || !expenses) return null;
    return calculateDre(invoices, revenues, expenses, year, revenueRegime);
  }, [selectedYear, invoices, revenues, expenses, revenueRegime]);

  const isLoading = isLoadingInvoices || isLoadingRevenues || isLoadingExpenses;

  useFinancialMenuDebug();

  const handleExportPdf = async () => {
    if (!dre) return;
    if (!guardBrandingPdfExport({ isPdfImagesLoading, hasBrandingUrls, toast })) return;
    const brandingUrls = brandingUrlsFromLocal(brandingData);
    const session = await createMmBrandedPdfSession(brandingUrls, undefined, pdfImages);
    reportBrandingPdfIssues(brandingUrls, session.branding.images, toast);
    const { doc, margins } = session;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = session.startY;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Demonstração do Resultado do Exercício (DRE)', pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exercício: ${selectedYear}`, pageWidth / 2, y, { align: 'center' });
    y += 15;
    doc.setFontSize(10);
    const lines = [
      ['1. Receita Bruta de Serviços', formatCurrency(dre.receitaBruta)],
      ['   Faturas recebidas (pagas)', formatCurrency(dre.receitaFaturas)],
      ['   Receitas de caixa', formatCurrency(dre.receitaCaixa)],
      ['2. Deduções da Receita', `(${formatCurrency(dre.deducoes)})`],
      ['3. Receita Líquida', formatCurrency(dre.receitaLiquida)],
      ['4. Despesas Operacionais', `(${formatCurrency(dre.despesasOperacionais)})`],
      ['5. Resultado Operacional', formatCurrency(dre.resultadoOperacional)],
      ['6. Outras receitas / (despesas)', formatCurrency(dre.outrasReceitasDespesas)],
      ['7. Resultado Líquido do Exercício', formatCurrency(dre.resultadoLiquido)],
    ];
    lines.forEach(([label, value]) => {
      y = session.ensureSpace(y, 7);
      doc.setFont('helvetica', label.startsWith('   ') ? 'normal' : label.startsWith('7.') ? 'bold' : 'normal');
      doc.text(label, margins.left, y);
      doc.text(value, pageWidth - margins.right, y, { align: 'right' });
      y += 7;
    });
    session.finalize();
    doc.save(`DRE_Contabil_${selectedYear}.pdf`);
    toast({ title: 'PDF exportado', description: 'Arquivo DRE_Contabil_' + selectedYear + '.pdf' });
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Permita pop-ups para imprimir.' });
      return;
    }
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>DRE Contábil ' + selectedYear + '</title>' +
      '<style>body{font-family:system-ui,sans-serif;padding:20px;max-width:800px;margin:0 auto}' +
      'table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}' +
      '.text-right{text-align:right}.font-bold{font-weight:700}.mt-4{margin-top:16px}</style></head><body>' +
      '<h1>Demonstração do Resultado do Exercício (DRE)</h1><p><strong>Exercício:</strong> ' + selectedYear + '</p>' +
      content + '</body></html>';
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
    toast({ title: 'Impressão', description: 'Use a janela de impressão do navegador.' });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="DRE Contábil">
        <div className="flex flex-nowrap items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <Label htmlFor="dre-exercicio" className="shrink-0 text-sm text-muted-foreground whitespace-nowrap">
              Exercício:
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="dre-exercicio" className="h-9 w-[92px] shrink-0 sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {dre && (
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1.5 px-2.5 sm:px-3" onClick={handleExportPdf}>
                <FileDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Exportar PDF</span>
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1.5 px-2.5 sm:px-3" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Imprimir</span>
              </Button>
            </div>
          )}
        </div>
      </PageHeader>

      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Demonstração do Resultado do Exercício (DRE)
            </CardTitle>
            <CardDescription>
              Escolha o <strong>regime de receita</strong> para evitar contar duas vezes o mesmo valor (fatura paga + receita de caixa vinculada).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Label htmlFor="dre-regime" className="shrink-0">Regime de receita</Label>
              <Select value={revenueRegime} onValueChange={(v) => setRevenueRegime(v as DreRevenueRegime)}>
                <SelectTrigger id="dre-regime" className="max-w-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DRE_REGIME_LABELS) as DreRevenueRegime[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {DRE_REGIME_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : dre ? (
              <>
                <div className="space-y-3 md:hidden">
                  {[
                    ['Receita Bruta de Serviços', formatCurrency(dre.receitaBruta)],
                    ['Receita Líquida', formatCurrency(dre.receitaLiquida)],
                    ['Despesas Operacionais', formatCurrency(dre.despesasOperacionais)],
                    ['Resultado Líquido', formatCurrency(dre.resultadoLiquido)],
                  ].map(([label, value]) => (
                    <Card key={label} className="rounded-xl border-border/70 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-lg font-semibold">{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60%]">Descrição</TableHead>
                      <TableHead className="text-right">Valor ({selectedYear})</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">1. Receita Bruta de Serviços</TableCell>
                      <TableCell className="text-right">{formatCurrency(dre.receitaBruta)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableCell className="pl-8 text-muted-foreground">
                        Faturas recebidas (pagas)
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(dre.receitaFaturas)}</TableCell>
                    </TableRow>
                    {revenueRegime === 'combinado_sem_duplicar' ? (
                      <>
                        <TableRow className="bg-muted/30">
                          <TableCell className="pl-8 text-muted-foreground">Receitas de caixa (total no período)</TableCell>
                          <TableCell className="text-right">{formatCurrency(dre.receitaCaixa)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableCell className="pl-10 text-muted-foreground text-xs">↳ vinculadas a faturas (excluídas da soma)</TableCell>
                          <TableCell className="text-right text-xs">{formatCurrency(dre.receitaCaixaVinculadaFatura)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableCell className="pl-10 text-muted-foreground text-xs">↳ avulsas (incluídas na receita bruta)</TableCell>
                          <TableCell className="text-right text-xs">{formatCurrency(dre.receitaCaixaAvulsa)}</TableCell>
                        </TableRow>
                      </>
                    ) : revenueRegime === 'caixa' ? (
                      <TableRow className="bg-muted/30">
                        <TableCell className="pl-8 text-muted-foreground">Receitas de caixa (lançamentos)</TableCell>
                        <TableCell className="text-right">{formatCurrency(dre.receitaCaixa)}</TableCell>
                      </TableRow>
                    ) : null}
                    <TableRow>
                      <TableCell className="font-medium">2. Deduções da Receita</TableCell>
                      <TableCell className="text-right">({formatCurrency(dre.deducoes)})</TableCell>
                    </TableRow>
                    <TableRow className="border-b-2 border-primary/30">
                      <TableCell className="font-semibold">3. Receita Líquida</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(dre.receitaLiquida)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">4. Despesas Operacionais</TableCell>
                      <TableCell className="text-right">({formatCurrency(dre.despesasOperacionais)})</TableCell>
                    </TableRow>
                    <TableRow className="border-b-2 border-primary/30">
                      <TableCell className="font-semibold">5. Resultado Operacional</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(dre.resultadoOperacional)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">6. Outras receitas / (despesas)</TableCell>
                      <TableCell className="text-right">{formatCurrency(dre.outrasReceitasDespesas)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10 border-t-2 border-primary">
                      <TableCell className="font-bold text-base">7. Resultado Líquido do Exercício</TableCell>
                      <TableCell className="text-right font-bold text-base">{formatCurrency(dre.resultadoLiquido)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                </div>

                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Dados integrados ao menu Financeiro: Faturas (receita faturada paga) e Lançamentos de Caixa (receitas e despesas).
                </p>

                <div className="mt-6 flex flex-wrap gap-4">
                  <Card className="flex-1 min-w-[180px]">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <TrendingUp className="h-4 w-4" />
                        Receita Líquida
                      </div>
                      <p className="text-xl font-semibold mt-1">{formatCurrency(dre.receitaLiquida)}</p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1 min-w-[180px]">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <TrendingDown className="h-4 w-4" />
                        Despesas
                      </div>
                      <p className="text-xl font-semibold mt-1">{formatCurrency(dre.despesasOperacionais)}</p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1 min-w-[180px]">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Minus className="h-4 w-4" />
                        Resultado Líquido
                      </div>
                      <p className={`text-xl font-semibold mt-1 ${dre.resultadoLiquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(dre.resultadoLiquido)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado disponível para o período.</p>
            )}
          </CardContent>
        </Card>

        {dre && (
          <div ref={printRef} className="hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr><th className="text-left p-2 border border-gray-300">Descrição</th><th className="text-right p-2 border border-gray-300">Valor ({selectedYear})</th></tr>
              </thead>
              <tbody>
                <tr><td className="p-2 border border-gray-300">1. Receita Bruta de Serviços</td><td className="text-right p-2 border border-gray-300">{formatCurrency(dre.receitaBruta)}</td></tr>
                <tr><td className="p-2 border border-gray-300 pl-6">Faturas recebidas (pagas)</td><td className="text-right p-2 border border-gray-300">{formatCurrency(dre.receitaFaturas)}</td></tr>
                <tr><td className="p-2 border border-gray-300 pl-6">Receitas de caixa (lançamentos)</td><td className="text-right p-2 border border-gray-300">{formatCurrency(dre.receitaCaixa)}</td></tr>
                <tr><td className="p-2 border border-gray-300">2. Deduções da Receita</td><td className="text-right p-2 border border-gray-300">({formatCurrency(dre.deducoes)})</td></tr>
                <tr><td className="p-2 border border-gray-300 font-semibold">3. Receita Líquida</td><td className="text-right p-2 border border-gray-300 font-semibold">{formatCurrency(dre.receitaLiquida)}</td></tr>
                <tr><td className="p-2 border border-gray-300">4. Despesas Operacionais</td><td className="text-right p-2 border border-gray-300">({formatCurrency(dre.despesasOperacionais)})</td></tr>
                <tr><td className="p-2 border border-gray-300 font-semibold">5. Resultado Operacional</td><td className="text-right p-2 border border-gray-300 font-semibold">{formatCurrency(dre.resultadoOperacional)}</td></tr>
                <tr><td className="p-2 border border-gray-300">6. Outras receitas / (despesas)</td><td className="text-right p-2 border border-gray-300">{formatCurrency(dre.outrasReceitasDespesas)}</td></tr>
                <tr><td className="p-2 border border-gray-300 font-bold">7. Resultado Líquido do Exercício</td><td className="text-right p-2 border border-gray-300 font-bold">{formatCurrency(dre.resultadoLiquido)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
