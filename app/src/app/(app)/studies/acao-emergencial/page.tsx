'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AcaoEmergencialPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Programa de Ação Emergencial">
        <Button size="sm" className="gap-1" disabled>
          <PlusCircle className="h-4 w-4" />
          Novo programa
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Programas em elaboração</CardTitle>
            <CardDescription>
              Elabore e acompanhe programas de ação emergencial para empreendimentos e obras.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empreendimento</TableHead>
                  <TableHead className="hidden md:table-cell">Requerente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum programa cadastrado.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
