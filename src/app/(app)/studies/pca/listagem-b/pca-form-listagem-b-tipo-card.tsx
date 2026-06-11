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
  PCA_LISTAGEM_B_FORM_TIPOS,
  type PcaListagemBFormTipo,
} from './pca-listagem-b-registry';
import { PcaSectionCard } from '../listagem-a/pca-form-listagem-a-helpers';
import type { PcaListagemBFormValues } from './pca-listagem-b-schema';

export function PcaListagemBFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<PcaListagemBFormValues>;
  currentTipo: PcaListagemBFormTipo;
  onTipoChange: (tipo: PcaListagemBFormTipo) => void;
}) {
  return (
    <PcaSectionCard title="Tipo de formulário – PCA Listagem B">
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do PCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as PcaListagemBFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(PCA_LISTAGEM_B_FORM_TIPOS) as [PcaListagemBFormTipo, string][]).map(
                  ([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Ferroligas (B-03-04-2), fundidos ferro/aço (B-03-07-7 / B-03-08-5), fundidos não ferrosos
              (B-04-04-9 / B-04-05-7), ficha industrial completa ou geral para demais códigos. Ao vincular
              empreendimento, o tipo é inferido pelo código DN.
            </FormDescription>
          </FormItem>
        )}
      />
    </PcaSectionCard>
  );
}
