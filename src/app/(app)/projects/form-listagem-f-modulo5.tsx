'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { SectionCard, TextField } from './form-listagem-a-helpers';

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

export function FormListagemFModulo5({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Módulo 5 – Caracterização ambiental">
        <p className="text-sm text-muted-foreground">Itens 31 a 33 – dados secundários e anexos de caracterização.</p>
      </SectionCard>

      <SectionCard title="31. Caracterização física">
        {camposFisica.map((campo) => (
          <TextField
            key={campo}
            form={form}
            name={`listagemF.caracterizacao.fisica.${campo.replace(/\s+/g, '_')}`}
            label={campo}
          />
        ))}
      </SectionCard>

      <SectionCard title="32. Caracterização biótica">
        {camposBioticos.map((campo) => (
          <TextField
            key={campo}
            form={form}
            name={`listagemF.caracterizacao.biotica.${campo.replace(/\s+/g, '_')}`}
            label={campo}
          />
        ))}
      </SectionCard>

      <SectionCard title="33. Caracterização socioeconômica">
        {camposSocio.map((campo) => (
          <TextField
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
      </SectionCard>
    </div>
  );
}
