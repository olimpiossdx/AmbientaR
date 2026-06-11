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
  PCA_LISTAGEM_E_FORM_TIPOS,
  type PcaListagemEFormTipo,
} from './pca-listagem-e-registry';
import { PcaSectionCard } from '../listagem-a/pca-form-listagem-a-helpers';
import type { PcaListagemEFormValues } from './pca-listagem-e-schema';

export function PcaListagemEFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<PcaListagemEFormValues>;
  currentTipo: PcaListagemEFormTipo;
  onTipoChange: (tipo: PcaListagemEFormTipo) => void;
}) {
  return (
    <PcaSectionCard title="Tipo de formulário – PCA Listagem E">
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do PCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as PcaListagemEFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(PCA_LISTAGEM_E_FORM_TIPOS) as [PcaListagemEFormTipo, string][]).map(
                  ([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Códigos E-01-10-4 a E-01-13-9 usam a ficha de dutos/gasodutos. Demais códigos da
              Listagem E usam o formulário geral.
            </FormDescription>
          </FormItem>
        )}
      />
    </PcaSectionCard>
  );
}
