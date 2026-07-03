'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import {
  listGeoAnalysesForUser,
  loadGeoAnalysisBundle,
} from '@/lib/geospatial/load-geo-analysis-bundle';

export type StudyGeoImportResult = {
  geoAnalysisId: string;
  areaHa: number;
  factualSummary: string;
  hidrologiaResumo?: string;
};

type StudyGeoImportPanelProps = {
  userId: string | undefined;
  empreendimentoId: string | undefined;
  initialGeoAnalysisId?: string;
  onImported: (result: StudyGeoImportResult) => void;
};

export function StudyGeoImportPanel({
  userId,
  empreendimentoId,
  initialGeoAnalysisId,
  onImported,
}: StudyGeoImportPanelProps) {
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const [analyses, setAnalyses] = React.useState<
    Awaited<ReturnType<typeof listGeoAnalysesForUser>>
  >([]);
  const [loadingList, setLoadingList] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(initialGeoAnalysisId ?? '');
  const [importing, setImporting] = React.useState(false);

  React.useEffect(() => {
    if (!firestore || !userId) return;
    let cancelled = false;
    setLoadingList(true);
    void (async () => {
      const idToken = await auth?.currentUser?.getIdToken();
      return listGeoAnalysesForUser(
        firestore,
        userId,
        empreendimentoId?.trim() || undefined,
        idToken ?? undefined,
      );
    })()
      .then((rows) => {
        if (!cancelled) setAnalyses(rows);
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth, firestore, userId, empreendimentoId]);

  const handleImport = async () => {
    if (!firestore || !userId || !selectedId) {
      toast({
        variant: 'destructive',
        title: 'Selecione uma análise',
        description: 'Escolha uma análise geoespacial na lista.',
      });
      return;
    }
    setImporting(true);
    try {
      const bundle = await loadGeoAnalysisBundle(firestore, selectedId, userId);
      if (!bundle) {
        toast({ variant: 'destructive', title: 'Análise não encontrada ou sem permissão.' });
        return;
      }
      const areaHa = bundle.wave.perimeter?.areaHa ?? 0;
      const factual = bundle.wave.factualSummary?.trim() ?? '';
      const hidro = bundle.wave.hidrologiaContext
        ? JSON.stringify(bundle.wave.hidrologiaContext, null, 2)
        : undefined;
      onImported({
        geoAnalysisId: selectedId,
        areaHa,
        factualSummary: factual,
        hidrologiaResumo: hidro,
      });
      toast({
        title: 'Análise importada',
        description: `Área do perímetro: ${areaHa.toFixed(2)} ha`,
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao importar',
        description: e instanceof Error ? e.message : 'Falha ao carregar análise.',
      });
    } finally {
      setImporting(false);
    }
  };

  if (!empreendimentoId?.trim()) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Análise geoespacial
          </CardTitle>
          <CardDescription>Vincule um empreendimento cadastrado para importar análise SIG.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Importar análise geoespacial
        </CardTitle>
        <CardDescription>
          Preenche campos topográficos / bacia com resumo factual de geo_analyses.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label>Análise</Label>
          <Select value={selectedId || '_none'} onValueChange={(v) => setSelectedId(v === '_none' ? '' : v)}>
            <SelectTrigger disabled={loadingList}>
              <SelectValue placeholder={loadingList ? 'Carregando…' : 'Selecione'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">—</SelectItem>
              {analyses.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.areaHa.toFixed(2)} ha — {a.okCount}/{a.total} camadas —{' '}
                  {a.generatedAtUtc?.slice(0, 10) ?? a.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="secondary" disabled={importing || !selectedId} onClick={handleImport}>
          {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Importar
        </Button>
      </CardContent>
    </Card>
  );
}
