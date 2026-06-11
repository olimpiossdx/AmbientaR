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
const atividadesDomissanitarios = [
  {
    id: 'saboes_detergentes',
    codigo: 'C-04-11-1',
    label: 'Fabricação de sabões e detergentes',
  },
  {
    id: 'limpeza_polimento',
    codigo: 'C-04-12-1',
    label: 'Fabricação de preparados para limpeza e polimento',
  },
  {
    id: 'domissanitarios',
    codigo: 'C-04-13-0',
    label: 'Fabricação de produtos domissanitários, inclusive sabões e detergentes',
  },
] as const;

export function PcaFormListagemCSecao6Domissanitarios({ form }: { form: any }) {
  return (
    <PcaSectionCard title="6. Atividade principal do empreendimento conforme DN 74/04">
      <div className="space-y-4">
        {atividadesDomissanitarios.map((atividade) => (
          <div key={atividade.id} className="space-y-3 rounded-md border p-3">
            <FormField
              control={form.control}
              name={`listagemC.domissanitarios.atividadesPrincipal.${atividade.id}.ativa`}
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
                    <p className="text-xs text-muted-foreground">Parâmetro: receita anual (R$)</p>
                  </div>
                </FormItem>
              )}
            />
            {form.watch(`listagemC.domissanitarios.atividadesPrincipal.${atividade.id}.ativa`) && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PcaTextField
                  form={form}
                  name={`listagemC.domissanitarios.atividadesPrincipal.${atividade.id}.receitaAnualRs`}
                  label="Receita anual (R$)"
                />
                <PcaTextField
                  form={form}
                  name={`listagemC.domissanitarios.atividadesPrincipal.${atividade.id}.inicioAtividade`}
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
