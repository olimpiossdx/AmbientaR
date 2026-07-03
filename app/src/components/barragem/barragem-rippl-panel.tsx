'use client';

import type { UseFormReturn } from 'react-hook-form';
import { RipplSeriesPanel } from '@/components/barragem/rippl-series-panel';

export type BarragemRipplFormValues = {
  regularizacaoRippl?: {
    volumeUtilRipplM3?: string;
    demandaAnualM3?: string;
    memorial?: string;
    ripplSeries?: Array<{
      label?: string;
      qAfluenteM3s?: string;
      qDemandaM3s?: string;
      diasNoPeriodo?: string;
      evapM3?: string;
    }>;
  };
  capacidadeArmazenamentoM3?: string;
  capacidadeReservatorio?: {
    volumeArmazenadoM3?: string;
  };
};

export type BarragemRipplFormApi = UseFormReturn<BarragemRipplFormValues>;

export function BarragemRipplPanel({ form }: { form: BarragemRipplFormApi }) {
  return (
    <RipplSeriesPanel
      form={form}
      paths={{
        series: 'regularizacaoRippl.ripplSeries',
        volumeUtil: 'regularizacaoRippl.volumeUtilRipplM3',
        memorial: 'regularizacaoRippl.memorial',
        demandaAnual: 'regularizacaoRippl.demandaAnualM3',
        capacidadePaths: ['capacidadeArmazenamentoM3', 'capacidadeReservatorio.volumeArmazenadoM3'],
      }}
      description="Regularização de vazões e dimensionamento do volume útil do reservatório (manual §5.5). Compare com a capacidade do item 3."
    />
  );
}
