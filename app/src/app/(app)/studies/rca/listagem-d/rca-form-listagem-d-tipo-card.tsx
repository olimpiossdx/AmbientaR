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
  RCA_LISTAGEM_D_FORM_TIPOS,
  RCA_LISTAGEM_D_TR_FILES,
  type RcaListagemDFormTipo,
} from './rca-listagem-d-registry';
import { RcaSectionCard } from '../listagem-a/rca-form-listagem-a-helpers';

export function RcaListagemDFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<any>;
  currentTipo: RcaListagemDFormTipo;
  onTipoChange: (tipo: RcaListagemDFormTipo) => void;
}) {
  const trFile = RCA_LISTAGEM_D_TR_FILES[currentTipo];

  return (
    <RcaSectionCard
      title="Tipo de formulário – RCA Listagem D"
      description="Seis fichas para indústria alimentícia. Aguardente, subprodutos animais e óleos/gorduras possuem TR dedicado em termos de referencia/LISTAGEM D/RCA/."
    >
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do RCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as RcaListagemDFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(RCA_LISTAGEM_D_FORM_TIPOS) as [RcaListagemDFormTipo, string][]).map(
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
                : 'TR não mapeado — verifique a pasta LISTAGEM D/RCA.'}
            </FormDescription>
          </FormItem>
        )}
      />
    </RcaSectionCard>
  );
}
