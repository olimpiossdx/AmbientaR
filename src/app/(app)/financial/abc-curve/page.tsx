'use client';
import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Button } from '@/components/ui/button';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Revenue, Invoice, Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useFinancialMenuDebug } from '@/lib/financial-menu-debug';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import type jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import {
  fetchBrandingImagesForPdf,
  brandingPdfMissingSlots,
  getImageDimensions,
  calcPdfImageSize,
} from '@/lib/branding-pdf';
import { useLocalBranding } from '@/hooks/use-local-branding';

type AbcSource = 'invoices' | 'revenues' | 'both';
type PeriodMode = 'year' | 'quarter' | 'month';
type AbcProfile = 'classic' | 'balanced' | 'strict';
type ClassFilter = 'ALL' | 'A' | 'B' | 'C';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const quarterOptions = [
  { value: '1', label: '1º trimestre (jan-mar)' },
  { value: '2', label: '2º trimestre (abr-jun)' },
  { value: '3', label: '3º trimestre (jul-set)' },
  { value: '4', label: '4º trimestre (out-dez)' },
];
const monthOptions = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

function addPageNumbers(doc: jsPDF, bottomMarginMm: number = 10) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${i}/${pageCount}`, pageWidth - bottomMarginMm, pageHeight - bottomMarginMm, { align: 'right' });
  }
}

function getRangeByPeriod(year: number, mode: PeriodMode, quarter: string, month: string) {
  if (mode === 'year') {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  if (mode === 'quarter') {
    const q = Number(quarter);
    const startMonth = String((q - 1) * 3 + 1).padStart(2, '0');
    const endDate = new Date(year, q * 3, 0);
    return { start: `${year}-${startMonth}-01`, end: endDate.toISOString().slice(0, 10) };
  }
  const endDate = new Date(year, Number(month), 0);
  return { start: `${year}-${month}-01`, end: endDate.toISOString().slice(0, 10) };
}

function datePart(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const s = String(dateStr).slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function AbcCurvePage() {
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [periodMode, setPeriodMode] = useState<PeriodMode>('year');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('1');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedSource, setSelectedSource] = useState<AbcSource>('invoices');
  const [abcProfile, setAbcProfile] = useState<AbcProfile>('classic');
  const [classFilter, setClassFilter] = useState<ClassFilter>('ALL');
  const [rankingLimit, setRankingLimit] = useState<string>('all');
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { data: brandingData } = useLocalBranding();
  const printRef = useRef<HTMLDivElement>(null);
  const yearNumber = Number(selectedYear);
  const cutoffA = abcProfile === 'classic' ? 80 : abcProfile === 'balanced' ? 75 : 70;
  const cutoffB = abcProfile === 'classic' ? 95 : abcProfile === 'balanced' ? 92 : 90;

  const revenuesQuery = useMemoFirebase(() => (firestore && user ? collection(firestore, 'revenues') : null), [firestore, user]);
  const { data: revenuesData, isLoading: isLoadingRevenues } = useCollection<Revenue>(revenuesQuery);

  const invoicesQuery = useMemoFirebase(() => (firestore && user ? collection(firestore, 'invoices') : null), [firestore, user]);
  const { data: invoicesData, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

  const clientsQuery = useMemoFirebase(() => (firestore && user ? collection(firestore, 'clients') : null), [firestore, user]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const clientsMap = useMemo(() => new Map(clients?.map(c => [c.id, c.name])), [clients]);
  
  const isLoading = isLoadingRevenues || isLoadingInvoices || isLoadingClients;

  useFinancialMenuDebug();

  const periodRange = useMemo(() => {
    if (Number.isNaN(yearNumber)) return null;
    return getRangeByPeriod(yearNumber, periodMode, selectedQuarter, selectedMonth);
  }, [yearNumber, periodMode, selectedQuarter, selectedMonth]);

  const previousPeriodConfig = useMemo(() => {
    if (Number.isNaN(yearNumber)) return null;
    if (periodMode === 'year') return { year: yearNumber - 1, quarter: '1', month: '01', mode: 'year' as const };
    if (periodMode === 'quarter') {
      const q = Number(selectedQuarter);
      return q > 1
        ? { year: yearNumber, quarter: String(q - 1), month: '01', mode: 'quarter' as const }
        : { year: yearNumber - 1, quarter: '4', month: '01', mode: 'quarter' as const };
    }
    const m = Number(selectedMonth);
    return m > 1
      ? { year: yearNumber, quarter: '1', month: String(m - 1).padStart(2, '0'), mode: 'month' as const }
      : { year: yearNumber - 1, quarter: '1', month: '12', mode: 'month' as const };
  }, [yearNumber, periodMode, selectedQuarter, selectedMonth]);

  const previousRange = useMemo(() => {
    if (!previousPeriodConfig) return null;
    return getRangeByPeriod(
      previousPeriodConfig.year,
      previousPeriodConfig.mode,
      previousPeriodConfig.quarter,
      previousPeriodConfig.month
    );
  }, [previousPeriodConfig]);

  const buildAbcDataset = useCallback((start: string, end: string) => {
    if (!revenuesData || !invoicesData || !clients) {
      return { tableData: [], classSummary: { A: { count: 0, revenue: 0 }, B: { count: 0, revenue: 0 }, C: { count: 0, revenue: 0 } } };
    }

    const clientRevenue: Record<string, number> = {};
    const inPeriod = (part: string) => part >= start && part <= end;

    if (selectedSource === 'revenues' || selectedSource === 'both') {
      revenuesData.forEach(revenue => {
        const date = datePart(revenue.date);
        if (!revenue.clientId || !inPeriod(date)) return;
        const amount = Number(revenue.amount) || 0;
        if (amount <= 0) return;
        clientRevenue[revenue.clientId] = (clientRevenue[revenue.clientId] || 0) + amount;
      });
    }

    if (selectedSource === 'invoices' || selectedSource === 'both') {
      invoicesData.forEach(invoice => {
        const date = datePart(invoice.invoiceDate);
        if (invoice.status !== 'Paid' || !inPeriod(date)) return;
        const amount = Number(invoice.amount) || 0;
        if (amount <= 0) return;
        clientRevenue[invoice.clientId] = (clientRevenue[invoice.clientId] || 0) + amount;
      });
    }

    const clientDataArray = Object.entries(clientRevenue).map(([clientId, totalRevenue]) => ({
      clientId,
      clientName: clientsMap.get(clientId) || 'Cliente Desconhecido',
      totalRevenue,
    }));

    const sortedClients = clientDataArray.sort((a, b) => b.totalRevenue - a.totalRevenue);
    const totalCombinedRevenue = sortedClients.reduce((acc, c) => acc + c.totalRevenue, 0);
    if (totalCombinedRevenue <= 0) {
      return { tableData: [], classSummary: { A: { count: 0, revenue: 0 }, B: { count: 0, revenue: 0 }, C: { count: 0, revenue: 0 } } };
    }

    let cumulativeRevenue = 0;
    const analyzedData = sortedClients.map(client => {
      cumulativeRevenue += client.totalRevenue;
      const revenuePercentage = (client.totalRevenue / totalCombinedRevenue) * 100;
      const cumulativeRevenuePercentage = (cumulativeRevenue / totalCombinedRevenue) * 100;
      let classification: 'A' | 'B' | 'C' = 'C';
      if (cumulativeRevenuePercentage <= cutoffA) classification = 'A';
      else if (cumulativeRevenuePercentage <= cutoffB) classification = 'B';

      return { ...client, revenuePercentage, cumulativeRevenuePercentage, classification };
    });

    const classSummary = analyzedData.reduce(
      (acc, item) => {
        acc[item.classification].count += 1;
        acc[item.classification].revenue += item.totalRevenue;
        return acc;
      },
      {
        A: { count: 0, revenue: 0 },
        B: { count: 0, revenue: 0 },
        C: { count: 0, revenue: 0 },
      }
    );

    return { tableData: analyzedData, classSummary };
  }, [revenuesData, invoicesData, clients, selectedSource, clientsMap, cutoffA, cutoffB]);

  const abcData = useMemo(() => {
    if (isLoading || !revenuesData || !invoicesData || !clients) {
      return { chartData: [], tableData: [], classSummary: { A: { count: 0, revenue: 0 }, B: { count: 0, revenue: 0 }, C: { count: 0, revenue: 0 } } };
    }
    if (!periodRange) {
      return { chartData: [], tableData: [], classSummary: { A: { count: 0, revenue: 0 }, B: { count: 0, revenue: 0 }, C: { count: 0, revenue: 0 } } };
    }
    const data = buildAbcDataset(periodRange.start, periodRange.end);
    const chartData = data.tableData.map(item => ({
      name: item.clientName,
      'Receita Acumulada (%)': parseFloat(item.cumulativeRevenuePercentage.toFixed(2)),
    }));
    return { chartData, tableData: data.tableData, classSummary: data.classSummary };
  }, [isLoading, revenuesData, invoicesData, clients, periodRange, buildAbcDataset]);

  const previousAbcData = useMemo(() => {
    if (!previousRange || isLoading || !revenuesData || !invoicesData || !clients) return null;
    return buildAbcDataset(previousRange.start, previousRange.end);
  }, [previousRange, isLoading, revenuesData, invoicesData, clients, buildAbcDataset]);

  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;
    console.groupCollapsed('[Financial Debug] Curva ABC');
    console.log('loading', { isLoadingRevenues, isLoadingInvoices, isLoadingClients, isLoading });
    console.log('counts', {
      revenues: revenuesData?.length ?? 0,
      invoices: invoicesData?.length ?? 0,
      clients: clients?.length ?? 0,
    });
    console.log('abcData', { chartPoints: abcData.chartData.length, tableRows: abcData.tableData.length });
    console.groupEnd();
  }, [
    isLoadingRevenues,
    isLoadingInvoices,
    isLoadingClients,
    isLoading,
    revenuesData?.length,
    invoicesData?.length,
    clients?.length,
    abcData.chartData.length,
    abcData.tableData.length,
  ]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const totalRevenue = useMemo(
    () => abcData.tableData.reduce((sum, item) => sum + item.totalRevenue, 0),
    [abcData.tableData]
  );
  const displayTableData = useMemo(() => {
    const filtered = classFilter === 'ALL'
      ? abcData.tableData
      : abcData.tableData.filter((item) => item.classification === classFilter);
    if (rankingLimit === 'all') return filtered;
    const limit = Number(rankingLimit);
    if (Number.isNaN(limit) || limit <= 0) return filtered;
    return filtered.slice(0, limit);
  }, [abcData.tableData, classFilter, rankingLimit]);

  const getClassificationVariant = (classification: 'A' | 'B' | 'C') => {
    switch (classification) {
      case 'A': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'B': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'C': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };

  const periodLabel = useMemo(() => {
    if (periodMode === 'year') return `Ano ${selectedYear}`;
    if (periodMode === 'quarter') {
      const quarter = quarterOptions.find((q) => q.value === selectedQuarter)?.label ?? `${selectedQuarter}º trimestre`;
      return `${quarter} de ${selectedYear}`;
    }
    const month = monthOptions.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;
    return `${month}/${selectedYear}`;
  }, [periodMode, selectedYear, selectedQuarter, selectedMonth]);

  const sourceLabel = useMemo(() => {
    if (selectedSource === 'invoices') return 'Faturas pagas';
    if (selectedSource === 'revenues') return 'Receitas de caixa';
    return 'Faturas + receitas (combinado)';
  }, [selectedSource]);

  const abcProfileLabel = useMemo(() => {
    if (abcProfile === 'classic') return 'Clássico (80/95)';
    if (abcProfile === 'balanced') return 'Balanceado (75/92)';
    return 'Rigoroso (70/90)';
  }, [abcProfile]);

  const comparison = useMemo(() => {
    const currentTotal = abcData.tableData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const previousTotal = previousAbcData?.tableData.reduce((sum, item) => sum + item.totalRevenue, 0) ?? 0;
    const currentClients = abcData.tableData.length;
    const previousClients = previousAbcData?.tableData.length ?? 0;
    const deltaRevenue = currentTotal - previousTotal;
    const deltaClients = currentClients - previousClients;
    const currentShareA = currentTotal > 0 ? (abcData.classSummary.A.revenue / currentTotal) * 100 : 0;
    const previousShareA = previousTotal > 0 ? ((previousAbcData?.classSummary.A.revenue ?? 0) / previousTotal) * 100 : 0;
    return {
      currentTotal,
      previousTotal,
      deltaRevenue,
      currentClients,
      previousClients,
      deltaClients,
      currentShareA,
      previousShareA,
      deltaShareA: currentShareA - previousShareA,
    };
  }, [abcData.tableData, abcData.classSummary.A.revenue, previousAbcData]);

  const handleExportPdf = async () => {
    if (displayTableData.length === 0) {
      toast({ variant: 'destructive', title: 'Sem dados', description: 'Não há dados para exportar no período selecionado.' });
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    const brandingUrls = {
      headerImageUrl: brandingData?.headerImageUrl,
      footerImageUrl: brandingData?.footerImageUrl,
      watermarkImageUrl: brandingData?.watermarkImageUrl,
    };
    const brandingLoaded = await fetchBrandingImagesForPdf(brandingUrls);
    const { headerBase64, footerBase64, watermarkBase64 } = brandingLoaded;
    const missing = brandingPdfMissingSlots(brandingUrls, brandingLoaded);
    if (missing.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Identidade visual incompleta no PDF',
        description: `Não foi possível carregar: ${missing.join(', ')}.`,
      });
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    let y = 15;

    if (watermarkBase64) {
      const imgProps = doc.getImageProperties(watermarkBase64);
      const aspectRatio = imgProps.width / imgProps.height;
      const watermarkWidth = 110;
      const watermarkHeight = watermarkWidth / aspectRatio;
      const wX = (pageWidth - watermarkWidth) / 2;
      const wY = (pageHeight - watermarkHeight) / 2;
      doc.addImage(
        watermarkBase64,
        'PNG',
        wX,
        wY,
        watermarkWidth,
        watermarkHeight,
        undefined,
        'FAST',
      );
    }

    if (headerBase64) {
      const dims = await getImageDimensions(headerBase64);
      const { w, h } = calcPdfImageSize(dims, contentWidth, 28);
      doc.addImage(headerBase64, 'PNG', margin, 8, w, h);
      y = 8 + h + 6;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Relatório Curva ABC de Clientes', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Período: ${periodLabel}`, margin, y);
    y += 5;
    doc.text(`Base: ${sourceLabel}`, margin, y);
    y += 5;
    doc.text(`Perfil ABC: ${abcProfileLabel}`, margin, y);
    y += 7;

    (['A', 'B', 'C'] as const).forEach((classKey) => {
      const entry = abcData.classSummary[classKey];
      const share = totalRevenue > 0 ? ((entry.revenue / totalRevenue) * 100).toFixed(2) : '0.00';
      doc.text(`Classe ${classKey}: ${entry.count} cliente(s) | ${formatCurrency(entry.revenue)} | ${share}%`, margin, y);
      y += 5;
    });
    y += 3;

    doc.setFont('helvetica', 'bold');
    doc.text('Cliente', margin, y);
    doc.text('Receita', 120, y, { align: 'right' });
    doc.text('% Receita', 155, y, { align: 'right' });
    doc.text('% Acum.', pageWidth - margin, y, { align: 'right' });
    y += 2;
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');

    displayTableData.forEach((item) => {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      const clientName = `${item.clientName} [${item.classification}]`;
      doc.text(clientName.slice(0, 52), margin, y);
      doc.text(formatCurrency(item.totalRevenue), 120, y, { align: 'right' });
      doc.text(`${item.revenuePercentage.toFixed(2)}%`, 155, y, { align: 'right' });
      doc.text(`${item.cumulativeRevenuePercentage.toFixed(2)}%`, pageWidth - margin, y, { align: 'right' });
      y += 5;
    });

    const totalPages = doc.getNumberOfPages();
    if (footerBase64) {
      const fDims = await getImageDimensions(footerBase64);
      const { w: fw, h: fh } = calcPdfImageSize(fDims, pageWidth - 2 * margin, 18);
      doc.setPage(totalPages);
      doc.addImage(footerBase64, 'PNG', margin, pageHeight - fh - 6, fw, fh);
    }
    addPageNumbers(doc, 10);

    doc.save(`Curva_ABC_${selectedYear}_${periodMode}_${abcProfile}.pdf`);
    toast({ title: 'PDF exportado', description: 'Relatório da Curva ABC gerado com sucesso.' });
  };

  const handleExportCsv = () => {
    if (displayTableData.length === 0) {
      toast({ variant: 'destructive', title: 'Sem dados', description: 'Não há dados para exportar no período selecionado.' });
      return;
    }
    const rows = [
      ['Cliente', 'Receita Total', '% Receita', '% Acumulada', 'Classificação'],
      ...displayTableData.map((item) => [
        item.clientName,
        item.totalRevenue.toFixed(2),
        item.revenuePercentage.toFixed(2),
        item.cumulativeRevenuePercentage.toFixed(2),
        item.classification,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Curva_ABC_${selectedYear}_${periodMode}_${abcProfile}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exportado', description: 'Planilha da Curva ABC gerada com sucesso.' });
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Permita pop-ups para imprimir.' });
      return;
    }
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Curva ABC</title>' +
      '<style>body{font-family:system-ui,sans-serif;padding:20px;max-width:900px;margin:0 auto}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}.text-right{text-align:right}</style></head><body>' +
      `<h1>Curva ABC de Clientes</h1><p><strong>Período:</strong> ${periodLabel}<br/><strong>Base:</strong> ${sourceLabel}<br/><strong>Perfil ABC:</strong> ${abcProfileLabel}</p>` +
      content + '</body></html>';
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Análise da Curva ABC de Clientes" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros e Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Exercício</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Período</Label>
                <Select value={periodMode} onValueChange={(value) => setPeriodMode(value as PeriodMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Ano inteiro</SelectItem>
                    <SelectItem value="quarter">Trimestre</SelectItem>
                    <SelectItem value="month">Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {periodMode === 'quarter' && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Trimestre</Label>
                  <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{quarterOptions.map((q) => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {periodMode === 'month' && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Mês</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{monthOptions.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Base</Label>
                <Select value={selectedSource} onValueChange={(value) => setSelectedSource(value as AbcSource)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoices">Faturas pagas</SelectItem>
                    <SelectItem value="revenues">Receitas de caixa</SelectItem>
                    <SelectItem value="both">Faturas + receitas (combinado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Perfil ABC</Label>
                <Select value={abcProfile} onValueChange={(value) => setAbcProfile(value as AbcProfile)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Clássico (80/95)</SelectItem>
                    <SelectItem value="balanced">Balanceado (75/92)</SelectItem>
                    <SelectItem value="strict">Rigoroso (70/90)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Classe</Label>
                <Select value={classFilter} onValueChange={(value) => setClassFilter(value as ClassFilter)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Ranking</Label>
                <Select value={rankingLimit} onValueChange={setRankingLimit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="20">Top 20</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Receita atual</p><p className="text-xl font-semibold">{formatCurrency(comparison.currentTotal)}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Receita período anterior</p><p className="text-xl font-semibold">{formatCurrency(comparison.previousTotal)}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Variação</p><p className={cn("text-xl font-semibold", comparison.deltaRevenue >= 0 ? "text-emerald-600" : "text-red-600")}>{comparison.deltaRevenue >= 0 ? "+" : ""}{formatCurrency(comparison.deltaRevenue)}</p></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Clientes ativos no período</p><p className="text-lg font-semibold">{comparison.currentClients} <span className="text-sm text-muted-foreground">({comparison.deltaClients >= 0 ? "+" : ""}{comparison.deltaClients} vs anterior)</span></p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Participação da Classe A</p><p className="text-lg font-semibold">{comparison.currentShareA.toFixed(2)}% <span className="text-sm text-muted-foreground">({comparison.deltaShareA >= 0 ? "+" : ""}{comparison.deltaShareA.toFixed(2)} p.p.)</span></p></CardContent></Card>
        </div>
        {selectedSource === 'both' && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Modo combinado pode gerar dupla contagem se o mesmo recebimento existir em <strong>Faturas</strong> e em <strong>Lançamentos de Caixa</strong>. Para análise gerencial mais conservadora, priorize uma única fonte.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['A', 'B', 'C'] as const).map((classKey) => {
            const entry = abcData.classSummary[classKey];
            const revenueShare = totalRevenue > 0 ? (entry.revenue / totalRevenue) * 100 : 0;
            return (
              <Card key={classKey}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Classe {classKey}</CardTitle>
                  <CardDescription>
                    {classKey === 'A' ? 'Prioridade alta (tipicamente atinge ~80% acumulado)' : classKey === 'B' ? 'Prioridade média (80% a 95%)' : 'Prioridade de manutenção (>95%)'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>Clientes: <strong>{entry.count}</strong></p>
                  <p>Receita: <strong>{formatCurrency(entry.revenue)}</strong></p>
                  <p>Participação: <strong>{revenueShare.toFixed(2)}%</strong></p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gráfico da Curva ABC</CardTitle>
            <CardDescription>
              Ordenação por receita decrescente com percentual acumulado (método de Pareto). Perfil ativo: {abcProfileLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[400px] w-full" /> : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={displayTableData.map((item) => ({
                    name: item.clientName,
                    'Receita Acumulada (%)': parseFloat(item.cumulativeRevenuePercentage.toFixed(2)),
                  }))}
                  margin={{
                    top: 10, right: 30, left: 20, bottom: 50,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 10 }}
                    height={80}
                  />
                  <YAxis 
                    label={{ value: 'Receita Acumulada (%)', angle: -90, position: 'insideLeft', offset: -10 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name]}
                    labelFormatter={(label) => `Cliente: ${label}`}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <ReferenceLine y={cutoffA} stroke="hsl(var(--chart-2))" strokeDasharray="4 4" label={`Corte A (${cutoffA}%)`} />
                  <ReferenceLine y={cutoffB} stroke="hsl(var(--chart-3))" strokeDasharray="4 4" label={`Corte B (${cutoffB}%)`} />
                  <Area type="monotone" dataKey="Receita Acumulada (%)" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tabela de Detalhes da Curva ABC por Cliente</CardTitle>
            <CardDescription>
              Classificação detalhada de cada cliente de acordo com sua contribuição para a receita total.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:hidden">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              {!isLoading && displayTableData.map((item) => (
                <Card key={item.clientId} className="rounded-xl border-border/70 shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{item.clientName}</p>
                      <Badge variant="outline" className={cn("font-bold", getClassificationVariant(item.classification))}>
                        {item.classification}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receita: {formatCurrency(item.totalRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      % Receita: {item.revenuePercentage.toFixed(2)}% | % Acumulada: {item.cumulativeRevenuePercentage.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
              ))}
              {!isLoading && displayTableData.length === 0 && (
                <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                  Nenhum dado de receita encontrado para análise.
                </div>
              )}
            </div>
            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Receita Total</TableHead>
                  <TableHead className="text-right">% da Receita</TableHead>
                  <TableHead className="text-right">% Acumulada</TableHead>
                  <TableHead className="text-center">Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto rounded-full" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && displayTableData.map((item) => (
                  <TableRow key={item.clientId}>
                    <TableCell className="font-medium">{item.clientName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                    <TableCell className="text-right">{item.revenuePercentage.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{item.cumulativeRevenuePercentage.toFixed(2)}%</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className={cn("font-bold", getClassificationVariant(item.classification))}>
                            {item.classification}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                 {!isLoading && displayTableData.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            Nenhum dado de receita encontrado para análise.
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
        <div ref={printRef} className="hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th>Cliente</th>
                <th className="text-right">Receita</th>
                <th className="text-right">% Receita</th>
                <th className="text-right">% Acumulada</th>
                <th>Classe</th>
              </tr>
            </thead>
            <tbody>
              {displayTableData.map((item) => (
                <tr key={`print-${item.clientId}`}>
                  <td>{item.clientName}</td>
                  <td className="text-right">{formatCurrency(item.totalRevenue)}</td>
                  <td className="text-right">{item.revenuePercentage.toFixed(2)}%</td>
                  <td className="text-right">{item.cumulativeRevenuePercentage.toFixed(2)}%</td>
                  <td>{item.classification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
