'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RcaSectionCard, RcaTextField } from '../listagem-a/rca-form-listagem-a-helpers';

const datums = ['SAD-69', 'WGS-84', 'Córrego Alegre'] as const;
const fusos = ['22', '23', '24'] as const;

function TrechoCoordenadasBlock({
  form,
  basePath,
  title,
}: {
  form: any;
  basePath: string;
  title: string;
}) {
  const formato = form.watch(`${basePath}.formato`);

  return (
    <div className="space-y-4 rounded-md border p-4">
      <h4 className="font-medium">{title}</h4>
      <FormField
        control={form.control}
        name={`${basePath}.datum`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Datum</FormLabel>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex flex-wrap gap-4"
            >
              {datums.map((datum) => (
                <FormItem key={datum} className="flex items-center gap-2">
                  <FormControl>
                    <RadioGroupItem value={datum} />
                  </FormControl>
                  <FormLabel className="font-normal">{datum}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${basePath}.formato`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Formato da coordenada</FormLabel>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex flex-wrap gap-4"
            >
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <RadioGroupItem value="Lat/Long" />
                </FormControl>
                <FormLabel className="font-normal">Lat/Long</FormLabel>
              </FormItem>
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <RadioGroupItem value="UTM" />
                </FormControl>
                <FormLabel className="font-normal">UTM</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormItem>
        )}
      />
      {formato === 'UTM' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <RcaTextField form={form} name={`${basePath}.utm.x`} label="Coordenada X (E)" />
          <RcaTextField form={form} name={`${basePath}.utm.y`} label="Coordenada Y (N)" />
          <FormField
            control={form.control}
            name={`${basePath}.utm.fuso`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuso</FormLabel>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-4"
                >
                  {fusos.map((fuso) => (
                    <FormItem key={fuso} className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value={fuso} />
                      </FormControl>
                      <FormLabel className="font-normal">{fuso}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormItem>
            )}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <RcaTextField form={form} name={`${basePath}.latLong.lat.grau`} label="Lat. grau" />
          <RcaTextField form={form} name={`${basePath}.latLong.lat.min`} label="Lat. min" />
          <RcaTextField form={form} name={`${basePath}.latLong.lat.seg`} label="Lat. seg" />
          <RcaTextField form={form} name={`${basePath}.latLong.long.grau`} label="Long. grau" />
          <RcaTextField form={form} name={`${basePath}.latLong.long.min`} label="Long. min" />
          <RcaTextField form={form} name={`${basePath}.latLong.long.seg`} label="Long. seg" />
        </div>
      )}
      <FormField
        control={form.control}
        name={`${basePath}.local`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Referência local</FormLabel>
            <FormControl>
              <Input {...field} value={String(field.value ?? '')} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

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
