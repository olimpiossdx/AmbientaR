'use client';

import * as React from 'react';
import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  BooleanRadio,
  CaracterizacaoEfluenteAntesDepois,
  DetalhesControleEmissoes,
  DisposicaoTemporariaResiduo,
  PcaCheckboxOptions,
  PcaNumField,
  PcaSectionCard,
  PcaSituacaoRegularizacao,
  PcaTabelaLinhasFixas,
  PcaTextField,
  PcaTextAreaField,
} from '../lib/pca-form-helpers';
import { PcaMedidasSection } from '../lib/pca-medidas-section';
const atividadesPlasticos = [
  {
    id: 'termoplastico_seco_sem_tinta',
    codigo: 'C-07-01-3',
    label:
      'Moldagem de termoplásticos não organoclorados, sem material reciclado ou com reciclado seco, sem tinta de gravação',
  },
  {
    id: 'termoplastico_seco_com_tinta',
    codigo: 'C-07-02-1',
    label:
      'Moldagem de termoplásticos não organoclorados, sem material reciclado ou com reciclado seco, com tinta de gravação',
  },
  {
    id: 'termofixo',
    codigo: 'C-07-01-4',
    label: 'Moldagem de termofixos ou endurecimento',
  },
  {
    id: 'termoplastico_lavagem_com_tinta',
    codigo: 'C-07-04-8',
    label:
      'Moldagem de termoplásticos não organoclorados com material reciclado por lavagem com água, com tinta de gravação',
  },
  {
    id: 'organoclorado',
    codigo: 'C-07-05-6',
    label:
      'Moldagem de termoplásticos organoclorados, sem material reciclado ou com reciclado seco',
  },
  {
    id: 'outras_termoplasticas',
    codigo: 'C-07-07-2',
    label: 'Outras indústrias de transformação de termoplásticos, não especificadas ou não classificadas',
  },
  {
    id: 'reciclagem_seca',
    codigo: 'F-05-01-0',
    label: 'Reciclagem de plástico por processo seco',
  },
  {
    id: 'reciclagem_lavagem',
    codigo: 'F-05-02-9',
    label: 'Reciclagem de plástico por processo de lavagem com água',
  },
  {
    id: 'reciclagem_agrotoxicos',
    codigo: 'F-05-03-7',
    label: 'Reciclagem de embalagens de agrotóxicos',
  },
] as const;

export function PcaFormListagemCSecao6Plasticos({ form }: { form: any }) {
  return (
    <PcaSectionCard title="6. Atividade principal do empreendimento conforme DN 74/04">
      <div className="space-y-4">
        {atividadesPlasticos.map((atividade) => (
          <div key={atividade.id} className="space-y-3 rounded-md border p-3">
            <FormField
              control={form.control}
              name={`listagemC.plasticos.atividadesPrincipal.${atividade.id}.ativa`}
              render={({ field }) => (
                <FormItem className="flex items-start gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal leading-snug">{atividade.label}</FormLabel>
                    <p className="text-xs text-muted-foreground">Código DN-74/04: {atividade.codigo}</p>
                    <p className="text-xs text-muted-foreground">Parâmetro: capacidade instalada (ton/dia)</p>
                  </div>
                </FormItem>
              )}
            />
            {form.watch(`listagemC.plasticos.atividadesPrincipal.${atividade.id}.ativa`) && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PcaTextField
                  form={form}
                  name={`listagemC.plasticos.atividadesPrincipal.${atividade.id}.capacidadeTonDia`}
                  label="Capacidade instalada (ton/dia)"
                />
                <PcaTextField
                  form={form}
                  name={`listagemC.plasticos.atividadesPrincipal.${atividade.id}.inicioAtividade`}
                  label="Início da atividade"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </PcaSectionCard>
  );
}
