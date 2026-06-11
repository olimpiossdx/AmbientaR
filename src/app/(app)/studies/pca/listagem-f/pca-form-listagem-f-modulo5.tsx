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
const camposFisica = [
  'Regime climático',
  'Geologia',
  'Classe do solo',
  'Estrutura do solo',
  'Permeabilidade do solo',
  'Profundidade do lençol freático',
  'Fluxo do lençol freático',
];

const camposBioticos = ['Bioma', 'Ecossistema', 'Flora, fauna e antropização', 'Outra caracterização'];

const camposSocio = [
  'Principais atividades econômicas do município',
  'Gestão ambiental do município',
  'Importância socioeconômica do empreendimento',
];

export function PcaFormListagemFModulo5({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <PcaSectionCard title="Módulo 5 – Caracterização ambiental">
        <p className="text-sm text-muted-foreground">Itens 31 a 33 – dados secundários e anexos de caracterização.</p>
      </PcaSectionCard>

      <PcaSectionCard title="31. Caracterização física">
        {camposFisica.map((campo) => (
          <PcaTextField
            key={campo}
            form={form}
            name={`listagemF.caracterizacao.fisica.${campo.replace(/\s+/g, '_')}`}
            label={campo}
          />
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="32. Caracterização biótica">
        {camposBioticos.map((campo) => (
          <PcaTextField
            key={campo}
            form={form}
            name={`listagemF.caracterizacao.biotica.${campo.replace(/\s+/g, '_')}`}
            label={campo}
          />
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="33. Caracterização socioeconômica">
        {camposSocio.map((campo) => (
          <PcaTextField
            key={campo}
            form={form}
            name={`listagemF.caracterizacao.socioeconomica.${campo.replace(/\s+/g, '_')}`}
            label={campo}
          />
        ))}
        <FormField
          control={form.control}
          name="listagemF.caracterizacao.observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outras observações / anexos</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>
    </div>
  );
}
