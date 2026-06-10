'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PiscinaoOffStreamPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Cadastro de Piscinão (off-stream)">
        <Button size="sm" className="gap-1" disabled>
          <PlusCircle className="h-4 w-4" />
          Novo cadastro
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Piscinões cadastrados</CardTitle>
            <CardDescription>
              Registre e gerencie piscinões off-stream vinculados a empreendimentos e estudos técnicos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empreendimento</TableHead>
                  <TableHead className="hidden md:table-cell">Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum piscinão cadastrado.
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
