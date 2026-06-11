'use client';

import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BooleanRadio, SectionCard, SituacaoRegularizacao, TextField } from './form-listagem-a-helpers';

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

export function FormListagemARochasOrnamentaisAgendas({ form }: { form: any }) {
  const base = 'listagemA.rochasOrnamentais';

  return (
    <>
      <SectionCard title="8. Intervenção / regularização ambiental – Agenda Verde">
        <FormField
          control={form.control}
          name={`${base}.agendaVerde.utilizaAutorizacao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Faz uso de autorização/regularização para intervenção ambiental?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch(`${base}.agendaVerde.utilizaAutorizacao`) && (
          <TextField form={form} name={`${base}.agendaVerde.situacaoGeral`} label='Se "Sim", definir a situação' />
        )}
        {itensAgendaVerde.map((item) => (
          <SituacaoRegularizacao
            key={item.id}
            form={form}
            name={`${base}.agendaVerde.itens.${item.id}`}
            label={item.label}
          />
        ))}
      </SectionCard>

      <SectionCard title="9. Intervenção em recurso hídrico – Agenda Azul">
        <FormField
          control={form.control}
          name={`${base}.agendaAzul.usoConcessionaria`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Faz uso de água da concessionária local?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch(`${base}.agendaAzul.usoConcessionaria`) && (
          <TextField form={form} name={`${base}.agendaAzul.concessionariaQual`} label="Qual concessionária?" />
        )}
        <FormField
          control={form.control}
          name={`${base}.agendaAzul.utilizaAutorizacao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Faz uso de autorização/regularização para intervenção em recurso hídrico?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch(`${base}.agendaAzul.utilizaAutorizacao`) && (
          <TextField form={form} name={`${base}.agendaAzul.situacaoGeral`} label='Se "Sim", definir a situação' />
        )}
        {itensAgendaAzul.map((item) => (
          <SituacaoRegularizacao
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
      </SectionCard>
    </>
  );
}
