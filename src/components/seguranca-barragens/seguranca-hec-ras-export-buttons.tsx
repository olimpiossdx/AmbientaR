'use client';

import * as React from 'react';
import { FileJson, Map as MapIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { EstudoSegurancaBarragem, ProjetoTecnicoBarragem } from '@/lib/types';
import { loadGeoAnalysisBundle } from '@/lib/geospatial/load-geo-analysis-bundle';
import {
  buildHecRasExportFileNames,
  buildHecRasGeoJson,
  buildHecRasInsumosJson,
  downloadTextFile,
  validateHecRasExport,
  type HecRasExportContext,
} from '@/lib/seguranca-barragens/hec-ras-export';

function useHecRasExportContext(estudo: EstudoSegurancaBarragem) {
  const { firestore, user } = useFirebase();

  const projetoRef = useMemoFirebase(
    () =>
      firestore && estudo.projetoTecnicoBarragemId
        ? doc(firestore, 'projetosTecnicosBarragem', estudo.projetoTecnicoBarragemId)
        : null,
    [firestore, estudo.projetoTecnicoBarragemId],
  );
  const { data: projeto } = useDoc<ProjetoTecnicoBarragem>(projetoRef);

  const loadContext = React.useCallback(async (): Promise<HecRasExportContext> => {
    let perimeterGeoJson: Record<string, unknown> | null = null;
    if (firestore && user?.uid && estudo.geoAnalysisId) {
      try {
        const bundle = await loadGeoAnalysisBundle(firestore, estudo.geoAnalysisId, user.uid);
        if (bundle?.wave?.perimeter?.geojson) {
          perimeterGeoJson = bundle.wave.perimeter.geojson as Record<string, unknown>;
        }
      } catch {
        /* perímetro opcional */
      }
    }
    return { projeto: projeto ?? null, perimeterGeoJson };
  }, [firestore, user?.uid, estudo.geoAnalysisId, projeto]);

  return { loadContext };
}

export function useSegurancaHecRasExport(estudo: EstudoSegurancaBarragem) {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState<'json' | 'geo' | null>(null);
  const { loadContext } = useHecRasExportContext(estudo);
  const issues = React.useMemo(() => validateHecRasExport(estudo), [estudo]);

  const runExport = React.useCallback(
    async (kind: 'json' | 'geo') => {
      if (issues.length) {
        toast({
          variant: 'destructive',
          title: 'Exportação HEC-RAS indisponível',
          description: issues.map((i) => i.message).join(' '),
        });
        return;
      }

      setBusy(kind);
      try {
        const context = await loadContext();
        const names = buildHecRasExportFileNames(estudo);

        if (kind === 'json') {
          const pkg = buildHecRasInsumosJson(estudo, context);
          downloadTextFile(JSON.stringify(pkg, null, 2), names.json, 'application/json');
          toast({ title: 'JSON HEC-RAS gerado', description: names.json });
        } else {
          const fc = buildHecRasGeoJson(estudo, context);
          downloadTextFile(JSON.stringify(fc, null, 2), names.geojson, 'application/geo+json');
          toast({ title: 'GeoJSON gerado', description: names.geojson });
        }
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Erro na exportação',
          description: e instanceof Error ? e.message : 'Falha ao gerar arquivo.',
        });
      } finally {
        setBusy(null);
      }
    },
    [estudo, issues, loadContext, toast],
  );

  return { busy, issues, exportJson: () => runExport('json'), exportGeo: () => runExport('geo') };
}

export function SegurancaHecRasExportButtons({ estudo }: { estudo: EstudoSegurancaBarragem }) {
  const { busy, exportJson, exportGeo } = useSegurancaHecRasExport(estudo);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              type="button"
              disabled={busy !== null}
              onClick={exportJson}
            >
              {busy === 'json' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4" />
              )}
              <span className="sr-only">Exportar JSON HEC-RAS</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exportar insumos JSON (Dam Break / hidrograma)</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              type="button"
              disabled={busy !== null}
              onClick={exportGeo}
            >
              {busy === 'geo' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Exportar GeoJSON</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exportar GeoJSON (ponto barragem + perímetro geo)</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
}

export function SegurancaHecRasExportPanel({ estudo }: { estudo: EstudoSegurancaBarragem }) {
  const { busy, issues, exportJson, exportGeo } = useSegurancaHecRasExport(estudo);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">Exportação para HEC-RAS (insumos preliminares)</p>
      <p className="text-xs text-muted-foreground">
        Gera pacote JSON com hidrograma triangular e GeoJSON com ponto da barragem (projeto técnico
        vinculado) e perímetro da análise geo, se houver.
      </p>
      {issues.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>{issues.map((i) => i.message).join(' ')}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={busy !== null} onClick={exportJson}>
          {busy === 'json' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileJson className="mr-2 h-4 w-4" />}
          JSON insumos HEC-RAS
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={exportGeo}>
          {busy === 'geo' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapIcon className="mr-2 h-4 w-4" />}
          GeoJSON contexto
        </Button>
      </div>
    </div>
  );
}
