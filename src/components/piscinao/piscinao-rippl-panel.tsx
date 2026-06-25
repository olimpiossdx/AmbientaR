'use client';

import type { UseFormReturn } from 'react-hook-form';
import { RipplSeriesPanel } from '@/components/barragem/rippl-series-panel';

export type PiscinaoRipplFormValues = {
  demandaHidrica?: {
    volumeUtilRipplM3?: string;
    demandaAnualM3?: string;
    ripplSeries?: Array<{
      label?: string;
      qAfluenteM3s?: string;
      qDemandaM3s?: string;
      diasNoPeriodo?: string;
      evapM3?: string;
    }>;
    regularizacao?: string;
  };
  caracteristicas?: {
    capacidadeUtilM3?: string;
  };
};

export type PiscinaoRipplFormApi = UseFormReturn<PiscinaoRipplFormValues>;

export function PiscinaoRipplPanel({ form }: { form: PiscinaoRipplFormApi }) {
  return (
    <RipplSeriesPanel
      form={form}
      paths={{
        series: 'demandaHidrica.ripplSeries',
        volumeUtil: 'demandaHidrica.volumeUtilRipplM3',
        memorial: 'demandaHidrica.regularizacao',
        demandaAnual: 'demandaHidrica.demandaAnualM3',
        capacidadePaths: ['caracteristicas.capacidadeUtilM3'],
      }}
    />
  );
}
