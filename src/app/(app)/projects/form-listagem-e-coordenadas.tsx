'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TextField } from './form-listagem-a-helpers';

const datums = ['SAD-69', 'WGS-84', 'Córrego Alegre'] as const;
const fusos = ['22', '23', '24'] as const;

export function TrechoCoordenadasBlock({
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
            <FormLabel>Datum (obrigatório)</FormLabel>
            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
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
            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
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
                <FormLabel className="font-normal">UTM (X, Y)</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormItem>
        )}
      />
      {formato === 'Lat/Long' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Latitude</p>
            <div className="grid grid-cols-3 gap-2">
              <TextField form={form} name={`${basePath}.latLong.lat.grau`} label="Grau" />
              <TextField form={form} name={`${basePath}.latLong.lat.min`} label="Min" />
              <TextField form={form} name={`${basePath}.latLong.lat.seg`} label="Seg" />
            </div>
          </div>
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Longitude</p>
            <div className="grid grid-cols-3 gap-2">
              <TextField form={form} name={`${basePath}.latLong.long.grau`} label="Grau" />
              <TextField form={form} name={`${basePath}.latLong.long.min`} label="Min" />
              <TextField form={form} name={`${basePath}.latLong.long.seg`} label="Seg" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField form={form} name={`${basePath}.utm.x`} label="X (6 dígitos)" />
          <TextField form={form} name={`${basePath}.utm.y`} label="Y (7 dígitos)" />
          <FormField
            control={form.control}
            name={`${basePath}.utm.fuso`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuso</FormLabel>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
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
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField form={form} name={`${basePath}.local`} label="Local (fazenda, sítio etc.)" />
        <TextField form={form} name={`${basePath}.municipio`} label="Município(s)" />
        <TextField
          form={form}
          name={`${basePath}.referenciaAdicional`}
          label="Referência adicional para localização"
          className="md:col-span-2"
        />
        <TextField form={form} name={`${basePath}.baciaHidrografica`} label="Bacia hidrográfica" />
        <TextField form={form} name={`${basePath}.subBaciaHidrografica`} label="Sub-bacia hidrográfica" />
        <TextField form={form} name={`${basePath}.upgrh`} label="UPGRH" />
        <TextField form={form} name={`${basePath}.cursoDaguaProximo`} label="Curso d'água mais próximo" />
      </div>
    </div>
  );
}
