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
  RCA_LISTAGEM_G_FORM_TIPOS,
  RCA_LISTAGEM_G_TR_FILES,
  type RcaListagemGFormTipo,
} from './rca-listagem-g-registry';
import { RcaSectionCard } from '../listagem-a/rca-form-listagem-a-helpers';

export function RcaListagemGFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<any>;
  currentTipo: RcaListagemGFormTipo;
  onTipoChange: (tipo: RcaListagemGFormTipo) => void;
}) {
  const trFile = RCA_LISTAGEM_G_TR_FILES[currentTipo];

  return (
    <RcaSectionCard
      title="Tipo de formulário – RCA Listagem G"
      description="Sete fichas para agrossilvipastoris. Bovinocultura e silvicultura possuem TR dedicado em termos de referencia/LISTAGEM G/RCA/. Culturas usa formulário completo legado."
    >
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do RCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as RcaListagemGFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(RCA_LISTAGEM_G_FORM_TIPOS) as [RcaListagemGFormTipo, string][]).map(
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
                : 'TR não mapeado — use campos específicos + módulos técnicos ou verifique LISTAGEM G/RCA.'}
            </FormDescription>
          </FormItem>
        )}
      />
    </RcaSectionCard>
  );
}
