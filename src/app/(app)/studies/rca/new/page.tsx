'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RcaForm } from '../rca-form';
import { StudyDynamicCreationPage } from '@/components/studies/study-dynamic-creation-page';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function NewRcaPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isDynamic = searchParams?.get('form') === 'dynamic';
    const initialListagemCode = searchParams?.get('listagem') ?? undefined;

    const handleSuccess = () => {
      router.push('/studies/rca');
    };

    if (isDynamic) {
      return (
        <StudyDynamicCreationPage
          studySlug="rca"
          studyLabel="RCA"
          pageTitle="Novo RCA (formulário do documento)"
          cardTitle="Adicionar novo RCA"
          listagemVariant="rca"
          staticFormHref="/studies/rca/new"
          onSuccess={handleSuccess}
        />
      );
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Relatório de Controle Ambiental">
          <Button variant="outline" size="sm" asChild>
            <Link href="/studies/rca/new?form=dynamic">Formulário do documento (TR)</Link>
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo RCA</CardTitle>
                      <CardDescription>
                          Elaboração do RCA — Listagens A a H harmonizadas. Use ?listagem=A…H na
                          URL ou selecione abaixo. Formulário dinâmico via TR: botão
                          &quot;Formulário do documento (TR)&quot;.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <RcaForm
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

export default function NewRcaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewRcaPageContent />
        </Suspense>
    )
}
