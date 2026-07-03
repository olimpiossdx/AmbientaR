'use client';

import { PageHeader } from '@/components/page-header';
import ReportingClient from './reporting-client';
import FinancialReportingClient from './financial-reporting-client';

export function ReportingView() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Relatórios Gerados por IA" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="space-y-8">
          <FinancialReportingClient />
          <ReportingClient />
        </div>
      </main>
    </div>
  );
}
