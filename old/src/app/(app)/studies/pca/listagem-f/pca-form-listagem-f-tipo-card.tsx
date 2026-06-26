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
  PCA_LISTAGEM_F_FORM_TIPOS,
  type PcaListagemFFormTipo,
} from './pca-listagem-f-registry';
import { PcaSectionCard } from '../listagem-a/pca-form-listagem-a-helpers';
import type { PcaListagemFFormValues } from './pca-listagem-f-schema';

export function PcaListagemFFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<PcaListagemFFormValues>;
  currentTipo: PcaListagemFFormTipo;
  onTipoChange: (tipo: PcaListagemFFormTipo) => void;
}) {
  return (
    <PcaSectionCard title="Tipo de formulário – PCA Listagem F">
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do PCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as PcaListagemFFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(PCA_LISTAGEM_F_FORM_TIPOS) as [PcaListagemFFormTipo, string][]).map(
                  ([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Código F-06-01-7 usa a ficha de posto de combustível. Demais códigos da Listagem F
              usam o formulário geral.
            </FormDescription>
          </FormItem>
        )}
      />
    </PcaSectionCard>
  );
}
