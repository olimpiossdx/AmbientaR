'use client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UseFormReturn } from 'react-hook-form';
import {
  RCA_LISTAGEM_A_FORM_TIPOS,
  RCA_LISTAGEM_A_TR_FILES,
  type RcaListagemAFormTipo,
} from './rca-listagem-a-registry';
import { RcaSectionCard } from './rca-form-listagem-a-helpers';
import type { RcaListagemAFormValues } from './rca-listagem-a-schema';

export function RcaListagemAFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<any>;
  currentTipo: RcaListagemAFormTipo;
  onTipoChange: (tipo: RcaListagemAFormTipo) => void;
}) {
  const trFile = RCA_LISTAGEM_A_TR_FILES[currentTipo];

  return (
    <RcaSectionCard
      title="Tipo de formulário – RCA Listagem A"
      description="Quatro fichas para atividades minerárias. Lavra subterrânea e rochas ornamentais possuem TR dedicado em termos de referencia/LISTAGEM A/RCA/."
    >
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do RCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as RcaListagemAFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(RCA_LISTAGEM_A_FORM_TIPOS) as [RcaListagemAFormTipo, string][]).map(
                  ([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              {trFile
                ? `TR vinculado: ${trFile}`
                : 'Sem TR específico na pasta RCA — estrutura alinhada ao formulário minerário padrão (módulos 1–7).'}
            </FormDescription>
          </FormItem>
        )}
      />
    </RcaSectionCard>
  );
}
