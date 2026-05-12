
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompanyForm } from '../company-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCadastroGestaoWriteGuard } from '@/hooks/use-cadastro-gestao-write-guard';

function NewCompanyPageContent() {
    const router = useRouter();
    const { blocked, isInitialized } = useCadastroGestaoWriteGuard('/responsible-company');

    const handleSuccess = () => {
      router.push('/responsible-company');
    };

    if (!isInitialized) {
      return (
        <div className="flex flex-col h-full">
          <PageHeader title="Nova Empresa Responsável" />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Skeleton className="mx-auto h-96 max-w-3xl" />
          </main>
        </div>
      );
    }
    if (blocked) return null;
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova Empresa Responsável" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Nova Empresa</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para cadastrar uma nova empresa parceira.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <CompanyForm
                          currentItem={null}
                          onSuccess={handleSuccess}
                          onCancel={() => router.back()}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function NewCompanyPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewCompanyPageContent />
        </Suspense>
    )
}
