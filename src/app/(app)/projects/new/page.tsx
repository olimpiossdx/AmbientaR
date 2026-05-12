'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProjectForm } from '../project-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCadastroGestaoWriteGuard } from '@/hooks/use-cadastro-gestao-write-guard';

function NewProjectPageContent() {
    const router = useRouter();
    const { blocked, isInitialized } = useCadastroGestaoWriteGuard('/projects');

    const handleSuccess = () => {
      router.push('/projects');
    };

    if (!isInitialized) {
      return (
        <div className="flex flex-col h-full">
          <PageHeader title="Novo Empreendimento" />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Skeleton className="mx-auto h-96 max-w-5xl" />
          </main>
        </div>
      );
    }
    if (blocked) return null;
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Empreendimento" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo Empreendimento</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo empreendimento.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ProjectForm
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

export default function NewProjectPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewProjectPageContent />
        </Suspense>
    )
}
