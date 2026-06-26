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
  PCA_LISTAGEM_A_FORM_TIPOS,
  type PcaListagemAFormTipo,
} from './pca-listagem-a-registry';
import { PcaSectionCard } from './pca-form-listagem-a-helpers';
import type { PcaListagemAFormValues } from './pca-listagem-a-schema';

export function PcaListagemAFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<PcaListagemAFormValues>;
  currentTipo: PcaListagemAFormTipo;
  onTipoChange: (tipo: PcaListagemAFormTipo) => void;
}) {
  return (
    <PcaSectionCard title="Tipo de formulário – PCA Listagem A">
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do PCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as PcaListagemAFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(PCA_LISTAGEM_A_FORM_TIPOS) as [PcaListagemAFormTipo, string][]).map(
                  ([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Cinco fichas: geral (demais códigos DN), lavra subterrânea (A-01-01-*), rochas
              ornamentais (A-02-06-2 e correlatos), extração areia/cascalho/argila e barragem de
              rejeitos. Ao vincular empreendimento, o tipo é inferido pela subatividade ou código DN.
            </FormDescription>
          </FormItem>
        )}
      />
    </PcaSectionCard>
  );
}
