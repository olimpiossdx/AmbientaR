'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { WaveAAnalysisResult } from '@/lib/types/geo-wave-a';
import {
  extractTriagemFromWaveResult,
  saveTriagemToSession,
} from '@/lib/cavidades/cavidades-triagem-bridge';

export function GeoCavidadesBridge({ wave }: { wave: WaveAAnalysisResult }) {
  const router = useRouter();
  const triagem = React.useMemo(() => extractTriagemFromWaveResult(wave), [wave]);

  if (!triagem) return null;

  const handleApply = () => {
    saveTriagemToSession(triagem);
    router.push('/studies/cavidades/new');
  };

  return (
    <Alert variant={triagem.criterioLocacionalIncide ? 'destructive' : 'default'}>
      <AlertTitle>Licenciamento espeleológico (MG)</AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-sm">{triagem.observacoesIde}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={handleApply}>
            Novo estudo com estes dados de triagem
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href="/studies/cavidades">Abrir estudos de cavidades</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
