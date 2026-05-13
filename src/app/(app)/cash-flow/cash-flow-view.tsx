'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueTable } from './revenue-table';
import { ExpenseTable } from './expense-table';
import { CashFlowChart } from './cash-flow-chart';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Printer, Search } from 'lucide-react';
import type { Revenue, Expense } from '@/lib/types';

type PeriodType = 'day' | 'month' | 'year';

export type CashFlowViewProps = {
  periodType: PeriodType;
  setPeriodType: (v: PeriodType) => void;
  periodDay: string;
  setPeriodDay: (v: string) => void;
  periodMonth: string;
  setPeriodMonth: (v: string) => void;
  periodYear: string;
  setPeriodYear: (v: string) => void;
  filterCliente: string;
  setFilterCliente: (v: string) => void;
  filterDataInicio: string;
  setFilterDataInicio: (v: string) => void;
  filterDataFim: string;
  setFilterDataFim: (v: string) => void;
  filterValorMin: string;
  setFilterValorMin: (v: string) => void;
  filterValorMax: string;
  setFilterValorMax: (v: string) => void;
  filterDescricao: string;
  setFilterDescricao: (v: string) => void;
  filteredRevenues: Revenue[];
  filteredExpenses: Expense[];
  isLoadingRevenues: boolean;
  isLoadingExpenses: boolean;
  onExportPdf: () => void;
  onPrint: () => void;
};

export function CashFlowView(props: CashFlowViewProps) {
  const router = useRouter();
  const {
    periodType,
    setPeriodType,
    periodDay,
    setPeriodDay,
    periodMonth,
    setPeriodMonth,
    periodYear,
    setPeriodYear,
    filterCliente,
    setFilterCliente,
    filterDataInicio,
    setFilterDataInicio,
    filterDataFim,
    setFilterDataFim,
    filterValorMin,
    setFilterValorMin,
    filterValorMax,
    setFilterValorMax,
    filterDescricao,
    setFilterDescricao,
    filteredRevenues,
    filteredExpenses,
    isLoadingRevenues,
    isLoadingExpenses,
    onExportPdf,
    onPrint,
  } = props;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Lançamentos de Caixa">
        <Tabs defaultValue="revenues">
          <TabsList>
            <TabsTrigger value="revenues" onClick={() => router.push('/cash-flow/new?type=revenue')}>+ Receita</TabsTrigger>
            <TabsTrigger value="expenses" onClick={() => router.push('/cash-flow/new?type=expense')}>+ Despesa</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="mb-4 border-border/60 bg-muted/30 shadow-sm">
          <CardHeader className="space-y-1 pb-2 pt-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <CardTitle className="text-base font-semibold">Filtrar lançamentos</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Refine a lista por cliente (receitas), texto, datas e faixa de valores.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="cf-filter-cliente" className="text-xs font-medium text-muted-foreground">
                  Cliente
                </Label>
                <Input
                  id="cf-filter-cliente"
                  placeholder="Nome (receitas)"
                  className="h-10 min-w-0"
                  value={filterCliente}
                  onChange={(e) => setFilterCliente(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-filter-desc" className="text-xs font-medium text-muted-foreground">
                  Descrição
                </Label>
                <Input
                  id="cf-filter-desc"
                  placeholder="Descrição"
                  className="h-10 min-w-0"
                  value={filterDescricao}
                  onChange={(e) => setFilterDescricao(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-filter-start" className="text-xs font-medium text-muted-foreground">
                  Data início
                </Label>
                <Input
                  id="cf-filter-start"
                  type="date"
                  className="h-10 min-w-0 pr-2 [color-scheme:light] dark:[color-scheme:dark]"
                  value={filterDataInicio}
                  onChange={(e) => setFilterDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-filter-end" className="text-xs font-medium text-muted-foreground">
                  Data fim
                </Label>
                <Input
                  id="cf-filter-end"
                  type="date"
                  className="h-10 min-w-0 pr-2 [color-scheme:light] dark:[color-scheme:dark]"
                  value={filterDataFim}
                  onChange={(e) => setFilterDataFim(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-filter-vmin" className="text-xs font-medium text-muted-foreground">
                  Valor mín.
                </Label>
                <Input
                  id="cf-filter-vmin"
                  type="number"
                  placeholder="0"
                  className="h-10 min-w-0"
                  value={filterValorMin}
                  onChange={(e) => setFilterValorMin(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-filter-vmax" className="text-xs font-medium text-muted-foreground">
                  Valor máx.
                </Label>
                <Input
                  id="cf-filter-vmax"
                  type="number"
                  placeholder="0"
                  className="h-10 min-w-0"
                  value={filterValorMax}
                  onChange={(e) => setFilterValorMax(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-border/60 bg-muted/30 shadow-sm">
          <CardHeader className="space-y-1 pb-2 pt-4">
            <CardTitle className="text-base font-semibold">Relatório por período</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              O período abaixo define o conteúdo do PDF e da impressão (receitas e despesas nesse intervalo).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
              <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-xl lg:flex-1">
                <div className="space-y-1.5">
                  <Label htmlFor="cf-period-type" className="text-xs font-medium text-muted-foreground">
                    Tipo de período
                  </Label>
                  <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
                    <SelectTrigger id="cf-period-type" className="h-10 w-full sm:max-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Dia</SelectItem>
                      <SelectItem value="month">Mês</SelectItem>
                      <SelectItem value="year">Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cf-period-value" className="text-xs font-medium text-muted-foreground">
                    {periodType === 'day' ? 'Data' : periodType === 'month' ? 'Mês' : 'Ano'}
                  </Label>
                  {periodType === 'day' && (
                    <Input
                      id="cf-period-value"
                      type="date"
                      className="h-10 min-w-0 pr-2 [color-scheme:light] dark:[color-scheme:dark]"
                      value={periodDay}
                      onChange={(e) => setPeriodDay(e.target.value)}
                    />
                  )}
                  {periodType === 'month' && (
                    <Input
                      id="cf-period-value"
                      type="month"
                      className="h-10 min-w-0 pr-2 [color-scheme:light] dark:[color-scheme:dark]"
                      value={periodMonth}
                      onChange={(e) => setPeriodMonth(e.target.value)}
                    />
                  )}
                  {periodType === 'year' && (
                    <Select value={periodYear} onValueChange={setPeriodYear}>
                      <SelectTrigger id="cf-period-value" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end lg:w-auto lg:shrink-0">
                <Button type="button" variant="outline" className="h-10 w-full gap-2 sm:min-w-[160px] sm:flex-1 lg:flex-initial" onClick={onExportPdf}>
                  <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                  Exportar PDF
                </Button>
                <Button type="button" variant="outline" className="h-10 w-full gap-2 sm:min-w-[160px] sm:flex-1 lg:flex-initial" onClick={onPrint}>
                  <Printer className="h-4 w-4 shrink-0" aria-hidden />
                  Imprimir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="revenues">Receitas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <CashFlowChart />
          </TabsContent>
          <TabsContent value="revenues">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Receitas</CardTitle>
                <CardDescription>Adicione, edite e visualize todas as entradas de caixa.</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueTable revenues={filteredRevenues} isLoadingRevenues={isLoadingRevenues} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Despesas</CardTitle>
                <CardDescription>Adicione, edite e visualize todas as saídas de caixa.</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseTable expenses={filteredExpenses} isLoadingExpenses={isLoadingExpenses} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
