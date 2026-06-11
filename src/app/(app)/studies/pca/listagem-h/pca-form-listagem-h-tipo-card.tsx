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
  PCA_LISTAGEM_H_FORM_TIPOS,
  type PcaListagemHFormTipo,
} from './pca-listagem-h-registry';
import { PcaSectionCard } from '../listagem-a/pca-form-listagem-a-helpers';
import type { PcaListagemHFormValues } from './pca-listagem-h-schema';

export function PcaListagemHFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<PcaListagemHFormValues>;
  currentTipo: PcaListagemHFormTipo;
  onTipoChange: (tipo: PcaListagemHFormTipo) => void;
}) {
  return (
    <PcaSectionCard title="Tipo de formulário – PCA Listagem H">
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do PCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as PcaListagemHFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(PCA_LISTAGEM_H_FORM_TIPOS) as [PcaListagemHFormTipo, string][]).map(
                  ([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Ficha H-01-01-1 para supressão em Mata Atlântica ou geral para demais códigos da
              Listagem H.
            </FormDescription>
          </FormItem>
        )}
      />
    </PcaSectionCard>
  );
}
