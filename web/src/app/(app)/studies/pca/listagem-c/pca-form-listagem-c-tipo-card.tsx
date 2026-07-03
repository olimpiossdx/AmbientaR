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
  PCA_LISTAGEM_C_FORM_TIPOS,
  type PcaListagemCFormTipo,
} from './pca-listagem-c-registry';
import { PcaSectionCard } from '../listagem-a/pca-form-listagem-a-helpers';
import type { PcaListagemCFormValues } from './pca-listagem-c-schema';

export function PcaListagemCFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<PcaListagemCFormValues>;
  currentTipo: PcaListagemCFormTipo;
  onTipoChange: (tipo: PcaListagemCFormTipo) => void;
}) {
  return (
    <PcaSectionCard title="Tipo de formulário – PCA Listagem C">
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do PCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as PcaListagemCFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(PCA_LISTAGEM_C_FORM_TIPOS) as [PcaListagemCFormTipo, string][]).map(
                  ([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Ficha principal para indústria química ou geral para demais códigos da Listagem C.
            </FormDescription>
          </FormItem>
        )}
      />
    </PcaSectionCard>
  );
}
