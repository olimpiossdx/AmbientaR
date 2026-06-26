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
const atividadesBorracha = [
  {
    id: 'pneumaticos',
    codigo: 'C-02-02-1',
    label:
      'Fabricação de pneumáticos, câmaras-de-ar e de material para recondicionamento de pneumáticos',
  },
  {
    id: 'recauchutagem',
    codigo: 'C-02-03-8',
    label: 'Recauchutagem de pneumáticos',
  },
  {
    id: 'artefatos_borracha',
    codigo: 'C-02-06-2',
    label:
      'Fabricação de artefatos de borracha (peças e acessórios para veículos, máquinas, correias, artigos domésticos, galochas, EPI etc.)',
  },
];

interface PcaFormListagemCSecao6Props {
  form: any;
}

export function PcaFormListagemCSecao6({ form }: PcaFormListagemCSecao6Props) {
  return (
    <PcaSectionCard title="6. Atividade principal do empreendimento conforme DN 217/17">
      <div className="space-y-4">
        {atividadesBorracha.map((atividade) => (
          <div key={atividade.id} className="space-y-3 rounded-md border p-3">
            <FormField
              control={form.control}
              name={`listagemC.atividadesPrincipal.${atividade.id}.ativa`}
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
                    <p className="text-xs text-muted-foreground">Código DN-217/17: {atividade.codigo}</p>
                  </div>
                </FormItem>
              )}
            />
            {form.watch(`listagemC.atividadesPrincipal.${atividade.id}.ativa`) && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <PcaTextField
                  form={form}
                  name={`listagemC.atividadesPrincipal.${atividade.id}.areaUtilHa`}
                  label="Área útil (ha)"
                />
                <PcaTextField
                  form={form}
                  name={`listagemC.atividadesPrincipal.${atividade.id}.numEmpregados`}
                  label="Nº de empregados"
                />
                <PcaTextField
                  form={form}
                  name={`listagemC.atividadesPrincipal.${atividade.id}.inicioAtividade`}
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
