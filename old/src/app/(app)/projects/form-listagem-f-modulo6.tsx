'use client';

import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { NumField, SectionCard, TextField } from './form-listagem-a-helpers';

const camadasZee = [
  'Vulnerabilidade natural',
  'Vulnerabilidade de solo a contaminação ambiental',
  'Vulnerabilidade de compactação do solo',
  'Suscetibilidade do solo a erosão',
  'Risco ambiental',
  'Qualidade da água superficial',
  'Disponibilidade natural de água superficial',
];

const escalas = ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta', 'Total comprometido'];

const indicesSocio = [
  'IPS',
  'População',
  'Distribuição espacial da população',
  'Razão de dependência',
  'Índice da malha rodoviária',
  'Índice VA indústria',
  'Índice VA serviços',
  'Índice VA agropecuária',
  'Índice renda',
  'Índice saúde',
  'Índice educação',
  'Índice IDH-M',
  'Índice gestão ambiental',
];

export function FormListagemFModulo6({ form }: { form: any }) {
  const { fields: municipios, append, remove } = useFieldArray({
    control: form.control,
    name: 'listagemF.zee.municipios',
  });

  return (
    <div className="space-y-6">
      <SectionCard title="Módulo 6 – Zoneamento ecológico-econômico (ZEE)">
        <p className="text-sm text-muted-foreground">Itens 34 e 35.</p>
      </SectionCard>

      <SectionCard title="34. Componente geofísico e biótico">
        {camadasZee.map((camada) => (
          <FormField
            key={camada}
            control={form.control}
            name={`listagemF.zee.geofisico.${camada.replace(/\s+/g, '_')}`}
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>{camada}</FormLabel>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-wrap gap-3"
                >
                  {escalas.map((escala) => (
                    <FormItem key={escala} className="flex items-center gap-1">
                      <FormControl>
                        <RadioGroupItem value={escala} />
                      </FormControl>
                      <FormLabel className="text-xs font-normal">{escala}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormItem>
            )}
          />
        ))}
      </SectionCard>

      <SectionCard title="35. Componente socioeconômico">
        {municipios.map((item, index) => (
          <div key={item.id} className="mb-4 rounded-md border p-3">
            <TextField form={form} name={`listagemF.zee.municipios.${index}.nome`} label="Município" />
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              {indicesSocio.map((ind) => (
                <NumField
                  key={ind}
                  form={form}
                  name={`listagemF.zee.municipios.${index}.indices.${ind.replace(/\s+/g, '_')}`}
                  label={ind}
                />
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => remove(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover município
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => append({ nome: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar município
        </Button>
      </SectionCard>
    </div>
  );
}
