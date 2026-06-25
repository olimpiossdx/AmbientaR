'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';
import { sortByIsoDateField } from '@/lib/firestore-list-helpers';
import type { Revenue, Expense, Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { downloadJsPdf } from '@/lib/branding-pdf';
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  guardBrandingExportFromHook,
  reportBrandingPdfIssues,
} from '@/lib/pdf-branding-layout';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { CashFlowView } from './cash-flow-view';
import { useFinancialMenuDebug } from '@/lib/financial-menu-debug';
import {
  filterCompanyCaixaExpenses,
  filterCompanyCaixaRevenues,
  expenseAmountForCompanyCaixa,
  revenueAmountForCompanyCaixa,
} from '@/lib/financial-transaction-scope';

type PeriodType = 'day' | 'month' | 'year';

function datePart(s: string | undefined): string {
  if (s == null || s === '') return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function getPeriodBounds(periodType: PeriodType, periodDay: string, periodMonth: string, periodYear: string): { start: string; end: string } {
  if (periodType === 'day') {
    return { start: periodDay, end: periodDay };
  }
  if (periodType === 'month') {
    const [y, m] = periodMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { start: periodMonth + '-01', end: periodMonth + '-' + String(lastDay).padStart(2, '0') };
  }
  return { start: periodYear + '-01-01', end: periodYear + '-12-31' };
}

export function CashFlowDashboardView() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [periodDay, setPeriodDay] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [periodMonth, setPeriodMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [periodYear, setPeriodYear] = useState<string>(() => String(new Date().getFullYear()));
  const [filterCliente, setFilterCliente] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [filterValorMin, setFilterValorMin] = useState('');
  const [filterValorMax, setFilterValorMax] = useState('');
  const [filterDescricao, setFilterDescricao] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const revenuesQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'revenues'), limit(500))
        : null,
    [firestore, user],
  );
  const { data: rawRevenues, isLoading: isLoadingRevenues } = useCollection<Revenue>(revenuesQuery);
  const expensesQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'expenses'), limit(500))
        : null,
    [firestore, user],
  );
  const { data: rawExpenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);
  const clientsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'clients'), limit(200)) : null),
    [firestore],
  );
  const { data: clients } = useCollection<Client>(clientsQuery);

  const allRevenues = useMemo(
    () =>
      rawRevenues
        ? sortByIsoDateField(
            filterCompanyCaixaRevenues(rawRevenues, rawExpenses ?? []),
            'date',
          )
        : undefined,
    [rawRevenues, rawExpenses],
  );
  const allExpenses = useMemo(
    () =>
      rawExpenses
        ? sortByIsoDateField(
            filterCompanyCaixaExpenses(rawExpenses, rawRevenues ?? []),
            'date',
          )
        : undefined,
    [rawExpenses, rawRevenues],
  );
  const clientsMap = useMemo(() => new Map(clients?.map(c => [c.id, c.name])), [clients]);

  const { start: periodStart, end: periodEnd } = getPeriodBounds(periodType, periodDay, periodMonth, periodYear);
  const revenuesInPeriod = useMemo(() => {
    if (!allRevenues) return [];
    return allRevenues.filter((r) => { const d = datePart(r.date); return d >= periodStart && d <= periodEnd; });
  }, [allRevenues, periodStart, periodEnd]);
  const expensesInPeriod = useMemo(() => {
    if (!allExpenses) return [];
    return allExpenses.filter((e) => { const d = datePart(e.date); return d >= periodStart && d <= periodEnd; });
  }, [allExpenses, periodStart, periodEnd]);

  const filteredRevenues = useMemo(() => {
    if (!allRevenues) return [];
    return allRevenues.filter((r) => {
      if (filterCliente.trim()) {
        const name = clientsMap.get(r.clientId ?? '') ?? '';
        if (!name.toLowerCase().includes(filterCliente.trim().toLowerCase())) return false;
      }
      if (filterDescricao.trim() && !(r.description || '').toLowerCase().includes(filterDescricao.trim().toLowerCase())) return false;
      const d = datePart(r.date);
      if (filterDataInicio && d < filterDataInicio) return false;
      if (filterDataFim && d > filterDataFim) return false;
      const vMin = filterValorMin !== '' ? parseFloat(filterValorMin) : null;
      const vMax = filterValorMax !== '' ? parseFloat(filterValorMax) : null;
      if (vMin != null && !Number.isNaN(vMin) && r.amount < vMin) return false;
      if (vMax != null && !Number.isNaN(vMax) && r.amount > vMax) return false;
      return true;
    });
  }, [allRevenues, clientsMap, filterCliente, filterDescricao, filterDataInicio, filterDataFim, filterValorMin, filterValorMax]);

  const filteredExpenses = useMemo(() => {
    if (!allExpenses) return [];
    return allExpenses.filter((e) => {
      if (filterDescricao.trim() && !(e.description || '').toLowerCase().includes(filterDescricao.trim().toLowerCase())) return false;
      const d = datePart(e.date);
      if (filterDataInicio && d < filterDataInicio) return false;
      if (filterDataFim && d > filterDataFim) return false;
      const vMin = filterValorMin !== '' ? parseFloat(filterValorMin) : null;
      const vMax = filterValorMax !== '' ? parseFloat(filterValorMax) : null;
      if (vMin != null && !Number.isNaN(vMin) && e.amount < vMin) return false;
      if (vMax != null && !Number.isNaN(vMax) && e.amount > vMax) return false;
      return true;
    });
  }, [allExpenses, filterDescricao, filterDataInicio, filterDataFim, filterValorMin, filterValorMax]);

  useFinancialMenuDebug();

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const periodLabel = periodType === 'day' ? periodDay : periodType === 'month' ? periodMonth : periodYear;

  const sumCaixaRevenueAmount = (list: Revenue[]) =>
    list.reduce(
      (s, r) =>
        s +
        revenueAmountForCompanyCaixa(r, rawRevenues ?? [], rawExpenses ?? []),
      0,
    );
  const sumCaixaExpenseAmount = (list: Expense[]) =>
    list.reduce(
      (s, e) =>
        s +
        expenseAmountForCompanyCaixa(e, rawRevenues ?? [], rawExpenses ?? []),
      0,
    );

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
    if (
      !guardBrandingExportFromHook({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
        formatLabel: 'PDF',
      })
    ) {
      return;
    }
    const brandingUrls = brandingUrlsFromLocal(brandingData);
    const session = await createMmBrandedPdfSession(brandingUrls, undefined, pdfImages);
    reportBrandingPdfIssues(brandingUrls, session.branding.images, toast);
    const { doc, margins } = session;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = session.startY;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Lan├ºamentos de Caixa por Per├¡odo', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Per├¡odo: ' + (periodType === 'day' ? 'Dia ' : periodType === 'month' ? 'M├¬s ' : 'Ano ') + periodLabel, pageWidth / 2, y, { align: 'center' });
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Receitas', margins.left, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    revenuesInPeriod.forEach((r) => {
      y = session.ensureSpace(y, 6);
      doc.text(new Date(r.date).toLocaleDateString('pt-BR'), margins.left, y);
      doc.text((r.description || '').slice(0, 50), margins.left + 25, y);
      doc.text(formatCurrency(r.amount), pageWidth - margins.right, y, { align: 'right' });
      y += 6;
    });
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Receitas: ' + formatCurrency(sumCaixaRevenueAmount(revenuesInPeriod)), margins.left, y);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Despesas', margins.left, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    expensesInPeriod.forEach((e) => {
      y = session.ensureSpace(y, 6);
      doc.text(new Date(e.date).toLocaleDateString('pt-BR'), margins.left, y);
      doc.text((e.description || '').slice(0, 50), margins.left + 25, y);
      doc.text(formatCurrency(e.amount), pageWidth - margins.right, y, { align: 'right' });
      y += 6;
    });
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Despesas: ' + formatCurrency(sumCaixaExpenseAmount(expensesInPeriod)), margins.left, y);

    session.finalize();
    downloadJsPdf(doc, 'lancamentos_caixa_' + periodLabel.replace(/-/g, '') + '.pdf');
    } finally {
      setIsExportingPdf(false);
    }
    toast({ title: 'PDF exportado', description: 'Relat├│rio por per├¡odo gerado.' });
  };

  const handlePrint = () => {
    const revRows = revenuesInPeriod.map((r) => '<tr><td>' + new Date(r.date).toLocaleDateString('pt-BR') + '</td><td>' + (r.description || '').slice(0, 60) + '</td><td class="text-right">' + formatCurrency(r.amount) + '</td></tr>').join('');
    const expRows = expensesInPeriod.map((e) => '<tr><td>' + new Date(e.date).toLocaleDateString('pt-BR') + '</td><td>' + (e.description || '').slice(0, 60) + '</td><td class="text-right">' + formatCurrency(e.amount) + '</td></tr>').join('');
    const totalRev = formatCurrency(sumCaixaRevenueAmount(revenuesInPeriod));
    const totalExp = formatCurrency(sumCaixaExpenseAmount(expensesInPeriod));
    const periodText = periodType === 'day' ? 'Dia ' : periodType === 'month' ? 'M├¬s ' : 'Ano ';
    const win = window.open('', '_blank');
    if (!win) { toast({ variant: 'destructive', title: 'Erro', description: 'Permita pop-ups para imprimir.' }); return; }
    const endBody = '</' + 'body></html>';
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lan├ºamentos de Caixa</title>' +
      '<style>body{font-family:system-ui,sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;} .text-right{text-align:right;}</style></head><body>' +
      '<h1>Lan├ºamentos de Caixa por Per├¡odo</h1><p><strong>Per├¡odo:</strong> ' + periodText + periodLabel + '</p>' +
      '<h2>Receitas</h2><table><thead><tr><th>Data</th><th>Descri├º├úo</th><th>Valor</th></tr></thead><tbody>' + revRows + '</tbody></table>' +
      '<p><strong>Total Receitas:</strong> ' + totalRev + '</p>' +
      '<h2>Despesas</h2><table><thead><tr><th>Data</th><th>Descri├º├úo</th><th>Valor</th></tr></thead><tbody>' + expRows + '</tbody></table>' +
      '<p><strong>Total Despesas:</strong> ' + totalExp + '</p>' + endBody;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
    toast({ title: 'Impress├úo', description: 'Use a janela de impress├úo do navegador.' });
  };

  return (
    <CashFlowView
      periodType={periodType}
      setPeriodType={setPeriodType}
      periodDay={periodDay}
      setPeriodDay={setPeriodDay}
      periodMonth={periodMonth}
      setPeriodMonth={setPeriodMonth}
      periodYear={periodYear}
      setPeriodYear={setPeriodYear}
      filterCliente={filterCliente}
      setFilterCliente={setFilterCliente}
      filterDataInicio={filterDataInicio}
      setFilterDataInicio={setFilterDataInicio}
      filterDataFim={filterDataFim}
      setFilterDataFim={setFilterDataFim}
      filterValorMin={filterValorMin}
      setFilterValorMin={setFilterValorMin}
      filterValorMax={filterValorMax}
      setFilterValorMax={setFilterValorMax}
      filterDescricao={filterDescricao}
      setFilterDescricao={setFilterDescricao}
      filteredRevenues={filteredRevenues}
      filteredExpenses={filteredExpenses}
      isLoadingRevenues={isLoadingRevenues}
      isLoadingExpenses={isLoadingExpenses}
      onExportPdf={handleExportPdf}
      isExportingPdf={isExportingPdf}
      onPrint={handlePrint}
    />
  );
}
