'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  listGeoAnalysesForUser,
  loadGeoAnalysisBundle,
  type GeoAnalysisBundle,
} from '@/lib/geospatial/load-geo-analysis-bundle';

export type GeoAnalysisRcaImportProps = {
  userId: string;
  laudoId: string;
  empreendimentoId: string;
  initialGeoAnalysisId?: string;
  onBundleChange: (bundle: GeoAnalysisBundle | null) => void;
};

export function GeoAnalysisRcaImport({
  userId,
  laudoId,
  empreendimentoId,
  initialGeoAnalysisId,
  onBundleChange,
}: GeoAnalysisRcaImportProps) {
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const [analyses, setAnalyses] = React.useState<
    Awaited<ReturnType<typeof listGeoAnalysesForUser>>
  >([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState(initialGeoAnalysisId ?? '');
  const [loadingBundle, setLoadingBundle] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!firestore) return;
    let cancelled = false;
    setLoadingList(true);
    void (async () => {
      const idToken = await auth?.currentUser?.getIdToken();
      return listGeoAnalysesForUser(
        firestore,
        userId,
        empreendimentoId,
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

  React.useEffect(() => {
    if (!firestore || !selectedId) {
      onBundleChange(null);
      return;
    }
    let cancelled = false;
    setLoadingBundle(true);
    void loadGeoAnalysisBundle(firestore, selectedId, userId)
      .then((bundle) => {
        if (!cancelled) onBundleChange(bundle);
      })
      .finally(() => {
        if (!cancelled) setLoadingBundle(false);
      });
    return () => {
      cancelled = true;
    };
  }, [firestore, selectedId, userId, onBundleChange]);

  const handleSaveLink = async () => {
    if (!firestore || !selectedId) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, 'laudos', laudoId), {
        geoAnalysisId: selectedId,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Análise vinculada',
        description:
          'Os placeholders geoespaciais serão usados na geração do DOCX deste laudo.',
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao vincular',
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5" />
          Passo 3 — Análise geoespacial (SIG)
        </CardTitle>
        <CardDescription>
          Importe uma análise factual já gerada em Análise Geoespacial (IA) para preencher
          placeholders no DOCX do laudo.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {loadingList ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando análises…
          </div>
        ) : analyses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma análise factual encontrada para este empreendimento. Gere primeiro o relatório
            de 8 camadas em{' '}
            <a href="/analise-ambiental" className="underline">
              Análise Geoespacial (IA)
            </a>
            .
          </p>
        ) : (
          <>
            <div className="grid gap-2">
              <Label>Análise salva</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma análise" />
                </SelectTrigger>
                <SelectContent>
                  {analyses.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.areaHa.toFixed(2)} ha · {a.okCount}/{a.total} camadas ·{' '}
                      {a.generatedAtUtc.slice(0, 10)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {loadingBundle && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Carregando pacote factual…
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!selectedId || saving}
              onClick={() => void handleSaveLink()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Vincular ao laudo
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
