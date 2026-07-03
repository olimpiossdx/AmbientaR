'use client';

import { FormDescription } from '@/components/ui/form';
import { TrechoCoordenadasBlock } from '@/components/coordinates';
import { PcaSectionCard } from '../lib/pca-form-helpers';

export function PcaFormListagemEGeoTrecho({ form }: { form: any }) {
  return (
    <PcaSectionCard title="5. Localização geográfica (trecho)">
      <FormDescription>
        Informar coordenadas do início e do final do trecho (Lat/Long e/ou UTM). No layout da rede, incluir ponto a cada 10 km (Anexo II).
      </FormDescription>
      <div className="space-y-4">
        <TrechoCoordenadasBlock form={form} basePath="listagemE.geoTrecho.inicio" title="Início do trecho" />
        <TrechoCoordenadasBlock form={form} basePath="listagemE.geoTrecho.fim" title="Final do trecho" />
      </div>
    </PcaSectionCard>
  );
}
