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
  RCA_LISTAGEM_B_FORM_TIPOS,
  RCA_LISTAGEM_B_TR_FILES,
  type RcaListagemBFormTipo,
} from './rca-listagem-b-registry';
import { RcaSectionCard } from '../listagem-a/rca-form-listagem-a-helpers';

export function RcaListagemBFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<any>;
  currentTipo: RcaListagemBFormTipo;
  onTipoChange: (tipo: RcaListagemBFormTipo) => void;
}) {
  const trFile = RCA_LISTAGEM_B_TR_FILES[currentTipo];

  return (
    <RcaSectionCard
      title="Tipo de formulário – RCA Listagem B"
      description="Sete fichas para indústria metalúrgica e afins. Fundidos e ligas ferrosas possuem TR dedicado em termos de referencia/LISTAGEM B/RCA/."
    >
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do RCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as RcaListagemBFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(RCA_LISTAGEM_B_FORM_TIPOS) as [RcaListagemBFormTipo, string][]).map(
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
                : 'TR não mapeado — verifique a pasta LISTAGEM B/RCA.'}
            </FormDescription>
          </FormItem>
        )}
      />
    </RcaSectionCard>
  );
}
