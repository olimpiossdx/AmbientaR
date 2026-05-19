'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDoc, useFirebase, useCollection } from '@/firebase';
import {
  addDoc,
  collection,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import type { InventoryCalculationRun, InventoryProject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { HelpCircle, Filter, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  AmostragemPanel,
  EstDiametricaPanel,
  EstruturasPanel,
  GenericCalculoPanel,
} from './calculation-panels';
import { MATA_NATIVA_LINKS } from '../mata-nativa-links';

const calculoOptions = [
  'Amostragem',
  'Florística',
  'Diversidade',
  'Agregação',
  'Estruturas',
  'ViAmpliado',
  'Est. Diamétrica',
  'An. Qualitativa',
  'Valoração',
  'Experimentação',
  'Agrupamento',
] as const;

function formatRunDate(createdAt: unknown): string {
  if (createdAt && typeof (createdAt as { toDate?: () => Date }).toDate === 'function') {
    try {
      return format((createdAt as { toDate: () => Date }).toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
    } catch {
      /* ignore */
    }
  }
  return '—';
}

export default function CalculadoraPage() {
  const params = useParams();
  const projectId = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [selectedCalculo, setSelectedCalculo] = React.useState<string | null>(null);
  const [runSaving, setRunSaving] = React.useState(false);
  const amostragemRunFnRef = React.useRef<(() => Record<string, unknown>) | null>(null);

  const projectDocRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const runsQuery = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return query(
      collection(firestore, 'inventories', projectId, 'calculationRuns'),
      orderBy('createdAt', 'desc'),
      limit(25),
    );
  }, [firestore, projectId]);

  const { data: project, isLoading } = useDoc<InventoryProject>(projectDocRef);
  const { data: runs, isLoading: runsLoading } = useCollection<InventoryCalculationRun>(runsQuery);

  const handleCalcular = async () => {
    if (!firestore || !projectId) {
      toast({ variant: 'destructive', title: 'Sessão', description: 'Firestore indisponível.' });
      return;
    }
    if (selectedCalculo === 'Amostragem') {
      const fn = amostragemRunFnRef.current;
      if (!fn) {
        toast({
          variant: 'destructive',
          title: 'Amostragem',
          description: 'Aguarde o painel carregar ou selecione Amostragem novamente.',
        });
        return;
      }
      const parameters = fn();
      setRunSaving(true);
      try {
        await addDoc(collection(firestore, 'inventories', projectId, 'calculationRuns'), {
          module: (parameters.module as string) ?? 'Amostragem',
          subModule: parameters.tab as string | undefined,
          label: `Amostragem — ${String(parameters.tab ?? '').replace(/-/g, ' ')}`,
          parameters,
          result: {
            message:
              'Configuração registada. O motor estatístico será aplicado quando parcelas/árvores estiverem ligados.',
          },
          status: 'stub',
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Execução registada', description: 'Corrida guardada no histórico do projeto.' });
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Erro ao gravar',
          description: (e as Error).message,
        });
      } finally {
        setRunSaving(false);
      }
      return;
    }
    toast({
      title: 'Em breve',
      description: `O módulo «${selectedCalculo}» ainda não grava execuções nesta versão.`,
    });
  };

  const openHelp = () => {
    window.open(MATA_NATIVA_LINKS.tutoriais, '_blank', 'noopener,noreferrer');
  };

  const openGuia = () => {
    window.open(MATA_NATIVA_LINKS.guiaInventario, '_blank', 'noopener,noreferrer');
  };

  const openCurso = () => {
    window.open(MATA_NATIVA_LINKS.cursoProcessamento, '_blank', 'noopener,noreferrer');
  };

  const openYoutube = () => {
    window.open(MATA_NATIVA_LINKS.youtubeSearch, '_blank', 'noopener,noreferrer');
  };

  const renderPanel = () => {
    if (!selectedCalculo) return null;
    const onClose = () => setSelectedCalculo(null);
    switch (selectedCalculo) {
      case 'Amostragem':
        return <AmostragemPanel onClose={onClose} className="h-full" runCollectorRef={amostragemRunFnRef} />;
      case 'Est. Diamétrica':
        return <EstDiametricaPanel onClose={onClose} className="h-full" />;
      case 'Estruturas':
        return <EstruturasPanel onClose={onClose} className="h-full" />;
      default:
        return <GenericCalculoPanel title={selectedCalculo} onClose={onClose} className="h-full" />;
    }
  };

  return (
    <>
      <header className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-2 md:px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {isLoading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <h1 className="truncate text-lg font-semibold md:text-xl">
              {project?.nome ?? 'Carregando…'}
              <span className="text-muted-foreground"> · Calculadora</span>
            </h1>
          )}
          <p className="text-xs text-muted-foreground md:text-sm">
            Seletor de cálculo inspirado no{' '}
            <a
              href={MATA_NATIVA_LINKS.guiaInventario}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Mata Nativa
            </a>
            . Amostragem: use «Calcular» para gravar a configuração no histórico (stub até o motor numérico).
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openGuia}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Guia inventário
          </Button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex w-full shrink-0 flex-col border-b bg-background md:w-72 md:border-b-0 md:border-r">
          <h2 className="mb-2 px-3 pt-3 text-sm font-semibold text-muted-foreground">Seletor de cálculo</h2>
          <div className="flex max-h-40 flex-row gap-1 overflow-x-auto px-2 pb-2 md:max-h-none md:flex-col md:overflow-visible">
            {calculoOptions.map((option) => (
              <Button
                key={option}
                variant={selectedCalculo === option ? 'secondary' : 'ghost'}
                size="sm"
                className="shrink-0 justify-start md:w-full"
                onClick={() => setSelectedCalculo(option)}
              >
                {option}
              </Button>
            ))}
          </div>
          <div className="mt-1 border-t px-3 py-2">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico</h3>
            {runsLoading && <Skeleton className="h-16 w-full" />}
            {!runsLoading && (!runs || runs.length === 0) && (
              <p className="text-xs text-muted-foreground">Nenhuma execução registada.</p>
            )}
            {!runsLoading && runs && runs.length > 0 && (
              <ul className="max-h-44 space-y-1 overflow-y-auto text-xs md:max-h-60">
                {runs.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/studies/inventario/${projectId}/resultado/${r.id}`}
                      className="block rounded-sm border bg-muted/20 px-2 py-1.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="font-medium leading-tight">{r.label}</div>
                      <div className="text-muted-foreground">{formatRunDate(r.createdAt)}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/30 p-3 md:p-6">
          {selectedCalculo ? (
            renderPanel()
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-background/80 p-6 text-sm text-muted-foreground">
              <p>Selecione um tipo de cálculo na lista à esquerda (amostragem, estrutura horizontal/vertical, est. diamétrica, etc.).</p>
              <p>
                Documentação de referência:{' '}
                <button type="button" className="text-primary underline" onClick={() => window.open(MATA_NATIVA_LINKS.amostragem, '_blank')}>
                  Amostragem no Mata Nativa
                </button>
                .
              </p>
            </div>
          )}
        </div>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-background p-3 md:p-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openHelp}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Tutoriais (Mata Nativa)
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={openCurso}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Curso em vídeo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={openYoutube}>
            <ExternalLink className="mr-2 h-4 w-4" />
            YouTube
          </Button>
          <Button type="button" variant="outline" size="sm" disabled title="Em breve">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCalculo(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={runSaving || !selectedCalculo}
            onClick={() => void handleCalcular()}
          >
            {runSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Calcular
          </Button>
        </div>
      </footer>
    </>
  );
}
