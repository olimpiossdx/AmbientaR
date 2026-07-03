'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useDoc, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { Consulta, Empreendedor, Project, AppUser, Laudo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Pencil, FileText, PlusCircle } from 'lucide-react';
import Link from 'next/link';

const CONSULTA_STATUS_LABEL: Record<Consulta['status'], string> = {
  nova: 'Nova',
  em_andamento: 'Em andamento',
  aguardando_dados: 'Aguardando dados',
  em_analise: 'Em análise',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const LAUDO_STATUS_LABEL: Record<Laudo['status'], string> = {
  rascunho: 'Rascunho',
  coletando_dados: 'Coletando dados',
  gerando: 'Gerando',
  pronto: 'Pronto',
  enviado: 'Enviado',
  cancelado: 'Cancelado',
};

const TIPO_SERVICO_LABEL: Record<string, string> = {
  RCA: 'RCA', PIA: 'PIA', PCA: 'PCA', PRADA: 'PRADA',
  InventarioFlorestal: 'Inventário Florestal', Fauna: 'Fauna', Outorgas: 'Outorgas',
  EducacaoAmbiental: 'Educação Ambiental', RelatorioDiverso: 'Relatório Diverso', Outro: 'Outro',
};

function formatDate(timestamp: any): string {
  if (!timestamp) return '—';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('pt-BR');
}

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="grid gap-1">
    <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
    <div className="text-sm">{value ?? '—'}</div>
  </div>
);

export function ConsultaDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { firestore } = useFirebase();
  const consultaDocRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'consultas', id) : null),
    [firestore, id]
  );
  const { data: consulta, isLoading } = useDoc<Consulta>(consultaDocRef);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore]
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore]
  );
  const { data: projects } = useCollection<Project>(projectsQuery);
  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users } = useCollection<AppUser>(usersQuery);
  const laudosQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'laudos') : null),
    [firestore]
  );
  const { data: laudos } = useCollection<Laudo>(laudosQuery);

  const empreendedorName = useMemo(() => {
    if (!consulta || !empreendedores) return '—';
    const e = empreendedores.find((x) => x.id === consulta.empreendedorId);
    return e?.name ?? '—';
  }, [consulta, empreendedores]);

  const empreendimentoName = useMemo(() => {
    if (!consulta?.empreendimentoId || !projects) return '—';
    const p = projects.find((x) => x.id === consulta.empreendimentoId);
    return p?.propertyName ?? '—';
  }, [consulta, projects]);

  const responsavelName = useMemo(() => {
    if (!consulta?.responsavelTecnicoUserId || !users) return '—';
    const u = users.find((x) => x.uid === consulta.responsavelTecnicoUserId);
    return (u?.name || u?.email) ?? '—';
  }, [consulta, users]);

  const laudosDaConsulta = useMemo(
    () => laudos?.filter((l) => l.consultaId === id) ?? [],
    [laudos, id]
  );

  if (isLoading || !consulta) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Consulta" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={`Consulta — ${TIPO_SERVICO_LABEL[consulta.tipoServico] ?? consulta.tipoServico}`}>
        <Button variant="outline" size="sm" onClick={() => router.push(`/consultas/${id}/edit`)}>
          <Pencil className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button size="sm" asChild>
          <Link href={`/laudos/new?consultaId=${id}`}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Novo laudo
          </Link>
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da demanda</CardTitle>
            <CardDescription>Criada em {formatDate(consulta.createdAt)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Empreendedor" value={empreendedorName} />
            <DetailItem label="Empreendimento" value={empreendimentoName} />
            <DetailItem label="Tipo de estudo" value={TIPO_SERVICO_LABEL[consulta.tipoServico] ?? consulta.tipoServico} />
            <DetailItem label="Canal" value={consulta.canal} />
            <DetailItem label="Status" value={CONSULTA_STATUS_LABEL[consulta.status]} />
            <DetailItem label="Responsável técnico" value={responsavelName} />
            <DetailItem label="Prazo previsto (SLA)" value={consulta.slaPrevisto ?? undefined} />
            <DetailItem label="Origem do lead" value={consulta.origemLead ?? undefined} />
            {consulta.descricaoProblema && (
              <div className="md:col-span-2">
                <DetailItem label="Descrição do problema / necessidade" value={consulta.descricaoProblema} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Laudos desta consulta</CardTitle>
            <CardDescription>Estudos técnicos gerados a partir desta demanda.</CardDescription>
          </CardHeader>
          <CardContent>
            {laudosDaConsulta.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum laudo ainda.</p>
            ) : (
              <ul className="space-y-2">
                {laudosDaConsulta.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">
                      {TIPO_SERVICO_LABEL[l.tipoEstudo] ?? l.tipoEstudo} — {formatDate(l.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{LAUDO_STATUS_LABEL[l.status]}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/laudos/${l.id}`}>
                          <FileText className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
