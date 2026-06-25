'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCadastroGestaoWriteGuard } from '@/hooks/use-cadastro-gestao-write-guard';

const ProjectForm = dynamic(
  () => import('../../project-form').then((m) => ({ default: m.ProjectForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

function EditProjectPageContent() {
    const router = useRouter();
    const params = useParams();
    const { blocked, isInitialized } = useCadastroGestaoWriteGuard('/projects');
    const itemId = (params?.id as string | undefined) ?? '';
    
    const { firestore } = useFirebase();

    const itemDocRef = useMemoFirebase(() => {
        if (!firestore || !itemId) return null;
        return doc(firestore, 'projects', itemId);
    }, [firestore, itemId]);

    const { data: item, isLoading } = useDoc<Project>(itemDocRef);

    const handleSuccess = () => {
      router.push('/projects');
    };

    if (!isInitialized) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando..." />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    <Skeleton className="mx-auto h-96 max-w-5xl" />
                </main>
            </div>
        );
    }
    if (blocked) return null;

    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando Empreendimento..." />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    <div className="max-w-5xl mx-auto">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-8 w-1/2" />
                                <Skeleton className="h-4 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[500px] w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }
    
    if (!item && !isLoading) {
         return (
             <div className="flex flex-col h-full">
                <PageHeader title="Erro" />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Empreendimento não encontrado</CardTitle>
                            <CardDescription>
                                O registro que você está tentando editar não foi encontrado.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </main>
            </div>
         )
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={`Editando Empreendimento: ${item?.propertyName || '...'}`} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Editar Empreendimento</CardTitle>
                      <CardDescription>
                          Atualize os detalhes do empreendimento abaixo.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
       		       <ProjectForm
                          currentItem={item}
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

export default function EditProjectPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditProjectPageContent />
        </Suspense>
    )
}
