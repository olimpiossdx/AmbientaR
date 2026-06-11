'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PcaForm } from '../pca-form';
import { StudyDynamicCreationPage } from '@/components/studies/study-dynamic-creation-page';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function NewPcaPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isDynamic = searchParams?.get('form') === 'dynamic';
    const initialListagemCode = searchParams?.get('listagem') ?? undefined;

    const handleSuccess = () => {
      router.push('/studies/pca');
    };

    if (isDynamic) {
      return (
        <StudyDynamicCreationPage
          studySlug="pca"
          studyLabel="PCA"
          pageTitle="Novo PCA (formulário do documento)"
          cardTitle="Adicionar novo PCA"
          listagemVariant="pca"
          staticFormHref="/studies/pca/new"
          onSuccess={handleSuccess}
        />
      );
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Plano de Controle Ambiental (PCA)">
          <Button variant="outline" size="sm" asChild>
            <Link href="/studies/pca/new?form=dynamic">Formulário do documento (TR)</Link>
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo PCA</CardTitle>
                      <CardDescription>
                          Elaboração do PCA — Listagens A a H disponíveis. Os dados podem ser
                          preenchidos a partir do empreendimento cadastrado. Formulário dinâmico via
                          TR: botão &quot;Formulário do documento (TR)&quot;.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <PcaForm
                          currentItem={null}
                          onSuccess={handleSuccess}
                          initialListagemCode={initialListagemCode}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function NewPcaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewPcaPageContent />
        </Suspense>
    )
}
