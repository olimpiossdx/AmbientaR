'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ibgeData } from '@/lib/ibge-data';
import * as React from 'react';

type UfMunicipioFieldsProps = {
  form: any;
  ufName: string;
  municipioName: string;
  ufLabel?: string;
  municipioLabel?: string;
  className?: string;
};

export function UfMunicipioFields({
  form,
  ufName,
  municipioName,
  ufLabel = 'UF',
  municipioLabel = 'Município',
  className,
}: UfMunicipioFieldsProps) {
  const selectedUf = form.watch(ufName) as string | undefined;

  const citiesForSelectedUf = React.useMemo(
    () => ibgeData.statesWithCities.find((state) => state.sigla === selectedUf)?.cidades || [],
    [selectedUf],
  );

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${className ?? ''}`}>
      <FormField
        control={form.control}
        name={ufName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{ufLabel}</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue(municipioName, '', { shouldDirty: true });
              }}
              value={field.value ?? ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a UF" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ibgeData.statesWithCities.map((state) => (
                  <SelectItem key={state.sigla} value={state.sigla}>
                    {state.sigla} — {state.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={municipioName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{municipioLabel}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!selectedUf}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={selectedUf ? 'Selecione o município' : 'Selecione a UF primeiro'} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-[min(20rem,60vh)]">
                {citiesForSelectedUf.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}
