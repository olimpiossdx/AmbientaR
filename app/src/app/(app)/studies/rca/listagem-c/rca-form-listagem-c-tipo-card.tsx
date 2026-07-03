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
  RCA_LISTAGEM_C_FORM_TIPOS,
  RCA_LISTAGEM_C_TR_FILES,
  type RcaListagemCFormTipo,
} from './rca-listagem-c-registry';
import { RcaSectionCard } from '../listagem-a/rca-form-listagem-a-helpers';

export function RcaListagemCFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<any>;
  currentTipo: RcaListagemCFormTipo;
  onTipoChange: (tipo: RcaListagemCFormTipo) => void;
}) {
  const trFile = RCA_LISTAGEM_C_TR_FILES[currentTipo];

  return (
    <RcaSectionCard
      title="Tipo de formulário – RCA Listagem C"
      description="Sete fichas para indústria química e afins. Borracha, plásticos, papel e limpeza possuem TR dedicado em termos de referencia/LISTAGEM C/RCA/."
    >
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do RCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as RcaListagemCFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(RCA_LISTAGEM_C_FORM_TIPOS) as [RcaListagemCFormTipo, string][]).map(
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
                : 'TR não mapeado — verifique a pasta LISTAGEM C/RCA.'}
            </FormDescription>
          </FormItem>
        )}
      />
    </RcaSectionCard>
  );
}
