'use client';

import { FormDescription } from '@/components/ui/form';
import { SectionCard } from './form-listagem-a-helpers';
import { TrechoCoordenadasBlock } from '@/components/coordinates';

export function FormListagemEGeoTrecho({ form }: { form: any }) {
  return (
    <SectionCard title="5. Localização geográfica (trecho)">
      <FormDescription>
        Informar coordenadas do início e do final do trecho (Lat/Long e/ou UTM). No layout da rede, incluir ponto a cada 10 km (Anexo II).
      </FormDescription>
      <div className="space-y-4">
        <TrechoCoordenadasBlock form={form} basePath="listagemE.geoTrecho.inicio" title="Início do trecho" />
        <TrechoCoordenadasBlock form={form} basePath="listagemE.geoTrecho.fim" title="Final do trecho" />
      </div>
    </SectionCard>
  );
}
