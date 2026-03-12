
'use client';

import { useMemo, useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, FileCheck, AlertTriangle, Clock, FolderKanban, Gift, CalendarIcon } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useAuth, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import type { Client, Empreendedor, Project, Condicionante, WaterPermit, EnvironmentalIntervention, License } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import EnvironmentalDashboard from '../environmental-dashboard';
import AgendaWidget from './agenda-widget';

/** Retorna apenas dígitos do CPF/CNPJ para comparação. */
function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Monta lista de variantes (original + só dígitos) para match no Firestore, máx 10. */
function documentVariants(cpf: string | undefined, cnpjs: string[] | undefined): string[] {
  const raw = [cpf, ...(cnpjs || [])].filter(Boolean) as string[];
  const withNormalized = new Set<string>();
  for (const v of raw) {
    withNormalized.add(v);
    const digits = onlyDigits(v);
    if (digits.length >= 11) withNormalized.add(digits);
  }
  return Array.from(withNormalized).slice(0, 10);
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const firestore = useFirestore();
  
  const [empreendedorIds, setEmpreendedorIds] = useState<string[] | undefined>(undefined);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (user && firestore) {
        setEmpreendedorIds(undefined);

        const isSelfRegistered = !!(user as any).package;

        if (isSelfRegistered) {
            const empreendedoresRef = collection(firestore, 'empreendedores');
            const qByUserId = query(empreendedoresRef, where('userId', '==', user.id));
            const qByApproved = query(empreendedoresRef, where('approvedUserIds', 'array-contains', user.id));
            Promise.all([getDocs(qByUserId), getDocs(qByApproved)]).then(([snapUserId, snapApproved]) => {
                const ids = new Set<string>([...snapUserId.docs.map(d => d.id), ...snapApproved.docs.map(d => d.id)]);
                setEmpreendedorIds(ids.size > 0 ? Array.from(ids) : ['non-existent-placeholder']);
            }).catch(() => {
                setEmpreendedorIds(['non-existent-placeholder']);
            });

            const clientsRef = collection(firestore, 'clients');
            const qClientByUserId = query(clientsRef, where('userId', '==', user.id));
            const qClientByApproved = query(clientsRef, where('approvedUserIds', 'array-contains', user.id));
            Promise.all([getDocs(qClientByUserId), getDocs(qClientByApproved)]).then(([snapU, snapA]) => {
                const first = snapU.docs[0] || snapA.docs[0];
                if (first) setClientId(first.id);
            }).catch(() => {});

            return;
        }

        // Cliente criado pelo admin: vínculo por userId no empreendedor e/ou por CPF/CNPJ
        const empreendedoresRef = collection(firestore, 'empreendedores');
        const clientsRef = collection(firestore, 'clients');

        const byUserId = getDocs(query(empreendedoresRef, where('userId', '==', user.id)));
        const byApproved = getDocs(query(empreendedoresRef, where('approvedUserIds', 'array-contains', user.id)));
        const userDocuments = documentVariants(user.cpf, user.cnpjs);

        if (userDocuments.length > 0) {
            const qClients = query(clientsRef, where('cpfCnpj', 'in', userDocuments));
            const qEmpreendedoresByDoc = query(empreendedoresRef, where('cpfCnpj', 'in', userDocuments));

            Promise.all([
                byUserId,
                byApproved,
                getDocs(qClients),
                getDocs(qEmpreendedoresByDoc),
            ]).then(([userIdSnapshot, approvedSnapshot, clientSnapshot, empreendedorSnapshot]) => {
                const idsByUserId = userIdSnapshot.docs.map(d => d.id);
                const idsByApproved = approvedSnapshot.docs.map(d => d.id);
                const idsByDoc = empreendedorSnapshot.docs.map(d => d.id);
                const mergedIds = Array.from(new Set([...idsByUserId, ...idsByApproved, ...idsByDoc]));

                if (!clientSnapshot.empty) {
                    setClientId(clientSnapshot.docs[0].id);
                } else {
                    const qClientByUserId = query(clientsRef, where('userId', '==', user.id));
                    const qClientByApproved = query(clientsRef, where('approvedUserIds', 'array-contains', user.id));
                    Promise.all([getDocs(qClientByUserId), getDocs(qClientByApproved)]).then(([sU, sA]) => {
                        const first = sU.docs[0] || sA.docs[0];
                        if (first) setClientId(first.id);
                    });
                }
                setEmpreendedorIds(mergedIds.length > 0 ? mergedIds : ['non-existent-placeholder']);
            }).catch(err => {
                console.error("Error fetching initial client data:", err);
                setEmpreendedorIds(['non-existent-placeholder']);
            });
        } else {
            Promise.all([byUserId, getDocs(query(empreendedoresRef, where('approvedUserIds', 'array-contains', user.id)))]).then(([userIdSnapshot, approvedSnapshot]) => {
                const ids = new Set<string>([...userIdSnapshot.docs.map(d => d.id), ...approvedSnapshot.docs.map(d => d.id)]);
                setEmpreendedorIds(ids.size > 0 ? Array.from(ids) : ['non-existent-placeholder']);
            }).catch(() => {
                setEmpreendedorIds(['non-existent-placeholder']);
            });
        }
    }
  }, [user, firestore]);
  
  const singleClientDocRef = useMemoFirebase(() => {
    if(!firestore || !clientId) return null;
    return doc(firestore, 'clients', clientId);
  }, [firestore, clientId]);
  
  const { data: clientData, isLoading: isLoadingClientData } = useDoc<Client>(singleClientDocRef);


  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0) return null;
    return query(collection(firestore, 'projects'), where('empreendedorId', 'in', empreendedorIds));
  }, [firestore, empreendedorIds]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const projectIds = useMemo(() => projects?.map(p => p.id) || [], [projects]);

  const licensesQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0) return null;
    return query(collection(firestore, 'licenses'), where('empreendedorId', 'in', empreendedorIds));
  }, [firestore, empreendedorIds]);
  const { data: licenses, isLoading: isLoadingLicenses } = useCollection<License>(licensesQuery);
  const licenseIds = useMemo(() => licenses?.map(l => l.id) || [], [licenses]);

  const outorgasQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0) return null;
    return query(collection(firestore, 'outorgas'), where('empreendedorId', 'in', empreendedorIds));
  }, [firestore, empreendedorIds]);
  const { data: outorgas, isLoading: isLoadingOutorgas } = useCollection<WaterPermit>(outorgasQuery);
  const outorgaIds = useMemo(() => outorgas?.map(o => o.id) || [], [outorgas]);

  const intervencoesQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0) return null;
    return query(collection(firestore, 'intervencoes'), where('empreendedorId', 'in', empreendedorIds));
  }, [firestore, empreendedorIds]);
  const { data: intervencoes, isLoading: isLoadingIntervencoes } = useCollection<EnvironmentalIntervention>(intervencoesQuery);
  const intervencaoIds = useMemo(() => intervencoes?.map(i => i.id) || [], [intervencoes]);

  const referenceIdsForCondicionantes = useMemo(() => {
    const ids = new Set<string>();
    licenseIds.forEach(id => ids.add(id));
    projectIds.forEach(id => ids.add(id));
    outorgaIds.forEach(id => ids.add(id));
    intervencaoIds.forEach(id => ids.add(id));
    return Array.from(ids);
  }, [licenseIds, projectIds, outorgaIds, intervencaoIds]);

  const CONDITIONANTES_CHUNK_SIZE = 10;
  const referenceIdChunks = useMemo(() => {
    if (!referenceIdsForCondicionantes.length || referenceIdsForCondicionantes.length <= CONDITIONANTES_CHUNK_SIZE) return [referenceIdsForCondicionantes];
    const chunks: string[][] = [];
    for (let i = 0; i < referenceIdsForCondicionantes.length; i += CONDITIONANTES_CHUNK_SIZE) {
      chunks.push(referenceIdsForCondicionantes.slice(i, i + CONDITIONANTES_CHUNK_SIZE));
    }
    return chunks;
  }, [referenceIdsForCondicionantes]);

  const condicionantesQuerySingle = useMemoFirebase(() => {
    if (!firestore || referenceIdsForCondicionantes.length === 0) return null;
    if (referenceIdsForCondicionantes.length <= CONDITIONANTES_CHUNK_SIZE) {
      return query(collection(firestore, 'condicionantes'), where('referenceId', 'in', referenceIdsForCondicionantes));
    }
    return null;
  }, [firestore, referenceIdsForCondicionantes]);

  const condicionantesQueryChunk0 = useMemoFirebase(() => {
    if (!firestore || referenceIdChunks.length < 1 || referenceIdChunks[0].length === 0) return null;
    return query(collection(firestore, 'condicionantes'), where('referenceId', 'in', referenceIdChunks[0]));
  }, [firestore, referenceIdChunks]);
  const condicionantesQueryChunk1 = useMemoFirebase(() => {
    if (!firestore || referenceIdChunks.length < 2 || referenceIdChunks[1].length === 0) return null;
    return query(collection(firestore, 'condicionantes'), where('referenceId', 'in', referenceIdChunks[1]));
  }, [firestore, referenceIdChunks]);
  const condicionantesQueryChunk2 = useMemoFirebase(() => {
    if (!firestore || referenceIdChunks.length < 3 || referenceIdChunks[2].length === 0) return null;
    return query(collection(firestore, 'condicionantes'), where('referenceId', 'in', referenceIdChunks[2]));
  }, [firestore, referenceIdChunks]);
  const condicionantesQueryChunk3 = useMemoFirebase(() => {
    if (!firestore || referenceIdChunks.length < 4 || referenceIdChunks[3].length === 0) return null;
    return query(collection(firestore, 'condicionantes'), where('referenceId', 'in', referenceIdChunks[3]));
  }, [firestore, referenceIdChunks]);
  const condicionantesQueryChunk4 = useMemoFirebase(() => {
    if (!firestore || referenceIdChunks.length < 5 || referenceIdChunks[4].length === 0) return null;
    return query(collection(firestore, 'condicionantes'), where('referenceId', 'in', referenceIdChunks[4]));
  }, [firestore, referenceIdChunks]);

  const { data: condicionantesSingle, isLoading: isLoadingCondicionantesSingle } = useCollection<Condicionante>(condicionantesQuerySingle);
  const { data: condicionantesChunk0, isLoading: isLoadingChunk0 } = useCollection<Condicionante>(condicionantesQueryChunk0);
  const { data: condicionantesChunk1, isLoading: isLoadingChunk1 } = useCollection<Condicionante>(condicionantesQueryChunk1);
  const { data: condicionantesChunk2, isLoading: isLoadingChunk2 } = useCollection<Condicionante>(condicionantesQueryChunk2);
  const { data: condicionantesChunk3, isLoading: isLoadingChunk3 } = useCollection<Condicionante>(condicionantesQueryChunk3);
  const { data: condicionantesChunk4, isLoading: isLoadingChunk4 } = useCollection<Condicionante>(condicionantesQueryChunk4);

  const condicionantesMerged = useMemo(() => {
    if (referenceIdChunks.length > 1) {
      const lists = [condicionantesChunk0, condicionantesChunk1, condicionantesChunk2, condicionantesChunk3, condicionantesChunk4].filter(Boolean) as (Condicionante[] | null | undefined)[];
      const merged: Condicionante[] = [];
      const seen = new Set<string>();
      for (const list of lists) {
        if (!list) continue;
        for (const item of list) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
      }
      return merged;
    }
    return null;
  }, [referenceIdChunks.length, condicionantesChunk0, condicionantesChunk1, condicionantesChunk2, condicionantesChunk3, condicionantesChunk4]);

  const condicionantes = condicionantesMerged ?? condicionantesSingle ?? null;
  const isLoadingCondicionantes = referenceIdChunks.length > 1
    ? isLoadingChunk0 || isLoadingChunk1 || isLoadingChunk2 || isLoadingChunk3 || isLoadingChunk4
    : isLoadingCondicionantesSingle;

  const stats = useMemo(() => {
    if (!projects || !condicionantes) return { active: 0, total: 0, pending: 0, nextExpiration: null };

    const activeLicenses = projects.filter(p => p.status === 'Válida');
    const totalLicenses = projects.length;
    const pendingCondicionantes = condicionantes?.filter(c => c.status === 'Pendente' || c.status === 'Atrasada').length || 0;

    const nextExpiration = activeLicenses
      .map(p => ({ ...p, expirationDate: p.expirationDate ? new Date(p.expirationDate) : null }))
      .filter(p => p.expirationDate && p.expirationDate > new Date())
      .sort((a, b) => a.expirationDate!.getTime() - b.expirationDate!.getTime())[0];
      
    return {
      active: activeLicenses.length,
      total: totalLicenses,
      pending: pendingCondicionantes,
      nextExpiration: nextExpiration ? {
          date: nextExpiration.expirationDate!.toLocaleDateString('pt-BR'),
          permit: nextExpiration.processNumber || `Licença do projeto ${nextExpiration.propertyName}`
      } : null,
    };
  }, [projects, condicionantes]);

  const isLoading = isLoadingProjects || isLoadingLicenses || isLoadingCondicionantes || isLoadingClientData || isLoadingOutorgas || isLoadingIntervencoes || empreendedorIds === undefined;
  const birthDate = clientData?.dataNascimento ? new Date(clientData.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não informado';

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Painel do Cliente" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
         <AgendaWidget />
         <Card>
            <CardHeader>
                <CardTitle>Bem-vindo(a), {user?.name || 'Cliente'}!</CardTitle>
                <CardDescription>Aqui está um resumo rápido dos seus empreendimentos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Licenças Ativas</CardTitle>
                            <FileCheck className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.active}</div>}
                            {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">de {stats.total} licenças totais</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Condicionantes Pendentes</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.pending}</div>}
                            {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">requerem sua atenção</p>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Próximo Vencimento</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.nextExpiration?.date || 'N/A'}</div>}
                            {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">{stats.nextExpiration?.permit || 'Nenhuma licença com vencimento futuro'}</p>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Data de Nascimento</CardTitle>
                            <Gift className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{birthDate}</div>}
                            {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">Sua data de nascimento registrada.</p>}
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
         </Card>
         
        <div className='mt-8'>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral de Gestão Ambiental</h2>
            <EnvironmentalDashboard 
                initialPermits={projects}
                initialCondicionantes={condicionantes}
                initialOutorgas={outorgas}
                initialIntervencoes={intervencoes}
                isLoading={isLoading}
            />
        </div>
      </main>
    </div>
  );
}
