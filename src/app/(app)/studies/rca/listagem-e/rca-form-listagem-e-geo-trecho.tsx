'use client';

import { TrechoCoordenadasBlock } from '@/components/coordinates';
import { RcaSectionCard } from '../listagem-a/rca-form-listagem-a-helpers';

export function RcaFormListagemEGeoTrecho({ form }: { form: any }) {
  return (
    <RcaSectionCard
      title="Localização geográfica do trecho"
      description="Coordenadas de início e fim do trecho (rodovias, dutos e minerodutos)."
    >
      <TrechoCoordenadasBlock
        form={form}
        basePath="listagemE.geoTrecho.inicio"
        title="Início do trecho"
      />
      <TrechoCoordenadasBlock
        form={form}
        basePath="listagemE.geoTrecho.fim"
        title="Final do trecho"
      />
    </RcaSectionCard>
  );
}
