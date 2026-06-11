
'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RcaForm } from '../rca-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function NewRcaModalContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialListagemCode = searchParams?.get('listagem') ?? undefined;

    const handleSuccess = () => {
      router.back();
    };
  
    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-7xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo RCA</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para criar um novo Relatório de Controle Ambiental.
                    </DialogDescription>
                </DialogHeader>
                <RcaForm
                    currentItem={null}
                    onSuccess={handleSuccess}
                    initialListagemCode={initialListagemCode}
                />
            </DialogContent>
        </Dialog>
    );
}


export default function NewRcaModal() {
    return (
        <Suspense fallback={
             <Dialog open={true}>
                <DialogContent>
                    <Skeleton className="h-[500px] w-full" />
                </DialogContent>
             </Dialog>
        }>
            <NewRcaModalContent />
        </Suspense>
    )
}
