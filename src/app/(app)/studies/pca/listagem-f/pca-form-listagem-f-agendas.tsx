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
const itensAgendaVerde = [
  { id: 'reserva_legal', label: 'Regularização de Reserva Legal' },
  { id: 'ocupacao_app', label: 'Regularização de ocupação antrópica consolidada ou não consolidada em APP' },
  { id: 'supressao_vegetacao', label: 'Supressão da cobertura vegetal nativa com ou sem destoca' },
  { id: 'intervencao_app', label: 'Intervenção em APP com ou sem supressão de vegetação nativa' },
  { id: 'destoca', label: 'Destoca em área de vegetação nativa' },
  { id: 'aproveitamento_lenhoso', label: 'Aproveitamento econômico do material lenhoso' },
  { id: 'corte_poda', label: 'Corte / poda de árvores isoladas' },
  { id: 'coleta_flora', label: 'Coleta/extração de plantas e/ou produtos da flora nativa' },
  { id: 'manejo_sustentavel', label: 'Manejo sustentável de vegetação nativa' },
];

const itensAgendaAzul = [
  { id: 'captacao_curso_agua', label: 'Captação em curso de água' },
  { id: 'poco_tubular', label: 'Poço tubular' },
  { id: 'poco_manual', label: 'Poço manual' },
  { id: 'rebaixamento', label: 'Rebaixamento' },
  { id: 'surgencia', label: 'Surgência' },
  { id: 'lancamento_efluente', label: 'Lançamento de efluente em corpo de água' },
  { id: 'outra', label: 'Outra (especificar)' },
];

export function PcaFormListagemFAgendas({ form }: { form: any }) {
  return (
    <>
      <PcaSectionCard title="9. Intervenção / regularização ambiental – Agenda Verde">
        <FormField
          control={form.control}
          name="listagemF.agendaVerde.utilizaAutorizacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Faz uso de autorização/regularização para intervenção ambiental?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {itensAgendaVerde.map((item) => (
          <PcaSituacaoRegularizacao
            key={item.id}
            form={form}
            name={`listagemF.agendaVerde.itens.${item.id}`}
            label={item.label}
          />
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="10. Intervenção em recurso hídrico – Agenda Azul">
        <FormField
          control={form.control}
          name="listagemF.agendaAzul.usoConcessionaria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Faz uso de recurso hídrico da concessionária local?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemF.agendaAzul.usoConcessionaria') && (
          <PcaTextField form={form} name="listagemF.agendaAzul.concessionariaQual" label="Qual?" />
        )}
        <FormField
          control={form.control}
          name="listagemF.agendaAzul.utilizaAutorizacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Faz uso de autorização/regularização para intervenção em recurso hídrico?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {itensAgendaAzul.map((item) => (
          <PcaSituacaoRegularizacao
            key={item.id}
            form={form}
            name={`listagemF.agendaAzul.itens.${item.id}`}
            label={`${item.label} – situação`}
          />
        ))}
        {form.watch('listagemF.agendaAzul.itens.outra') && (
          <FormField
            control={form.control}
            name="listagemF.agendaAzul.outraEspecificar"
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
