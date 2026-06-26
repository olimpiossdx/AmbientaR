'use client';



import * as React from 'react';

import { useFieldArray } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';

import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { Checkbox } from '@/components/ui/checkbox';

import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { PlusCircle, Trash2 } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import type { PcaListagemAFormValues } from './pca-listagem-a-schema';

import {

  PcaBooleanRadio,

  PcaCheckboxOptions,

  PcaNumField,

  PcaSectionCard,

  PcaTabelaLinhasFixas,

  PcaTextField,

  PcaTextAreaField,

  PcaSituacaoRegularizacao,

} from './pca-form-listagem-a-helpers';

const itensAgendaVerde = [
  { id: 'reserva_legal', label: 'Reserva legal' },
  { id: 'ocupacao_app', label: 'Ocupação antrópica consolidada ou não consolidada em APP' },
  { id: 'supressao_vegetacao', label: 'Supressão de vegetação nativa com ou sem destoca' },
  { id: 'intervencao_app', label: 'Intervenção em APP' },
  { id: 'destoca', label: 'Destoca' },
  { id: 'aproveitamento_lenhoso', label: 'Aproveitamento econômico do material lenhoso' },
  { id: 'corte_poda', label: 'Corte / poda de árvores isoladas' },
  { id: 'coleta_flora', label: 'Coleta de produtos da flora nativa' },
  { id: 'manejo_sustentavel', label: 'Manejo sustentável de vegetação nativa' },
];

const itensAgendaAzul = [
  { id: 'captacao_curso_agua', label: 'Captação em curso de água' },
  { id: 'poco_tubular', label: 'Poço tubular' },
  { id: 'poco_manual', label: 'Poço manual' },
  { id: 'rebaixamento', label: 'Rebaixamento do lençol freático' },
  { id: 'surgencia', label: 'Surgência' },
  { id: 'lancamento_efluente', label: 'Lançamento de efluente em corpo de água' },
  { id: 'outra', label: 'Outra' },
];

export function PcaFormListagemARochasAgendas({ form }: { form: any }) {
  const base = 'listagemA.rochasOrnamentais';

  return (
    <>
      <PcaSectionCard title="8. Intervenção / regularização ambiental – Agenda Verde">
        <PcaBooleanRadio form={form} name={`${base}.agendaVerde.utilizaAutorizacao`} label="Faz uso de autorização/regularização para intervenção ambiental?" />
        {form.watch(`${base}.agendaVerde.utilizaAutorizacao`) && (
          <PcaTextField form={form} name={`${base}.agendaVerde.situacaoGeral`} label='Se "Sim", definir a situação' />
        )}
        {itensAgendaVerde.map((item) => (
          <PcaSituacaoRegularizacao
            key={item.id}
            form={form}
            name={`${base}.agendaVerde.itens.${item.id}`}
            label={item.label}
          />
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="9. Intervenção em recurso hídrico – Agenda Azul">
        <PcaBooleanRadio form={form} name={`${base}.agendaAzul.usoConcessionaria`} label="Faz uso de água da concessionária local?" />
        {form.watch(`${base}.agendaAzul.usoConcessionaria`) && (
          <PcaTextField form={form} name={`${base}.agendaAzul.concessionariaQual`} label="Qual concessionária?" />
        )}
        <PcaBooleanRadio form={form} name={`${base}.agendaAzul.utilizaAutorizacao`} label="Faz uso de autorização/regularização para intervenção em recurso hídrico?" />
        {form.watch(`${base}.agendaAzul.utilizaAutorizacao`) && (
          <PcaTextField form={form} name={`${base}.agendaAzul.situacaoGeral`} label='Se "Sim", definir a situação' />
        )}
        {itensAgendaAzul.map((item) => (
          <PcaSituacaoRegularizacao
            key={item.id}
            form={form}
            name={`${base}.agendaAzul.itens.${item.id}`}
            label={`${item.label} – situação`}
          />
        ))}
        {form.watch(`${base}.agendaAzul.itens.outra`) && (
          <FormField
            control={form.control}
            name={`${base}.agendaAzul.outraEspecificar`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outra – especificar</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </PcaSectionCard>
    </>
  );
}
