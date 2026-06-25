'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { MaskedInput } from '@/components/ui/masked-input';
import { useFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const ClientForm = dynamic(
  () => import('../client-form').then((m) => ({ default: m.ClientForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

const MIN_CPF_LENGTH = 11;

function NewClientPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firestore } = useFirebase();
  const [step, setStep] = useState<'cpf' | 'form'>('cpf');
  const [cpfCnpjInitial, setCpfCnpjInitial] = useState('');
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [existingClient, setExistingClient] = useState<Client | null>(null);

  const prefilledFromAnalise = (): Partial<Client> | null => {
    const name = searchParams?.get('name');
    const cpfCnpj = searchParams?.get('cpfCnpj');
    const municipio = searchParams?.get('municipio');
    const uf = searchParams?.get('uf');
    if (!name && !cpfCnpj && !municipio && !uf) return null;
    return { name: name ?? '', cpfCnpj: cpfCnpj ?? '', municipio: municipio ?? '', uf: uf ?? '' };
  };

  const initialFromAnalise = prefilledFromAnalise();
  const skipCpfStep = !!(
    initialFromAnalise?.cpfCnpj &&
    initialFromAnalise.cpfCnpj.replace(/\D/g, '').length >= MIN_CPF_LENGTH
  );

  const handleCpfContinue = async () => {
    const digits = cpfCnpjInitial.replace(/\D/g, '');
    if (digits.length < MIN_CPF_LENGTH) {
      setCpfError('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
      return;
    }
    setCpfError(null);
    setExistingClient(null);
    if (firestore && digits.length >= MIN_CPF_LENGTH) {
      const q = query(
        collection(firestore, 'clients'),
        where('cpfCnpj', '==', cpfCnpjInitial.trim()),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setExistingClient({ id: docSnap.id, ...docSnap.data() } as Client);
      }
    }
    setStep('form');
  };

  const handleCpfChange = (value: string) => {
    setCpfCnpjInitial(value);
    setCpfError(null);
  };

  const handleSuccess = () => {
    router.push('/clients');
  };

  const handleCancel = () => {
    if (step === 'form' && !skipCpfStep) {
      setStep('cpf');
      setCpfCnpjInitial('');
      setExistingClient(null);
    } else {
      router.back();
    }
  };

  const initialClient =
    step === 'form' && cpfCnpjInitial
      ? ({ ...initialFromAnalise, cpfCnpj: cpfCnpjInitial } as Partial<Client>)
      : initialFromAnalise && Object.values(initialFromAnalise).some(Boolean)
        ? initialFromAnalise
        : null;

  const showCpfStep = !skipCpfStep && step === 'cpf';

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Novo Cliente" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {showCpfStep ? (
            <Card>
              <CardHeader>
                <CardTitle>Checagem de CPF/CNPJ</CardTitle>
                <CardDescription>
                  A primeira etapa do cadastro é informar o CPF ou CNPJ do cliente. Em seguida você
                  preenche os demais dados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPF / CNPJ</label>
                  <MaskedInput
                    mask="cpfCnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={cpfCnpjInitial}
                    onChange={handleCpfChange}
                    className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {cpfError ? <p className="text-sm text-destructive">{cpfError}</p> : null}
                </div>
                <Button onClick={handleCpfContinue}>Continuar com o cadastro</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Cliente</CardTitle>
                <CardDescription>
                  {existingClient
                    ? `Já existe um cliente com este CPF/CNPJ: ${existingClient.name}. Você pode editar os dados abaixo ou voltar e informar outro documento.`
                    : initialClient
                      ? 'Dados iniciais preenchidos. Revise e complete o cadastro.'
                      : 'Preencha os detalhes para criar um novo cliente.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientForm
                  currentClient={existingClient}
                  defaultDraft={
                    !existingClient &&
                    initialClient &&
                    Object.values(initialClient).some(Boolean)
                      ? initialClient
                      : null
                  }
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export function NewClientView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewClientPageContent />
    </Suspense>
  );
}
