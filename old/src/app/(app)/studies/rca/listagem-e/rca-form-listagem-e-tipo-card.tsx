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
  RCA_LISTAGEM_E_FORM_TIPOS,
  RCA_LISTAGEM_E_TR_FILES,
  type RcaListagemEFormTipo,
} from './rca-listagem-e-registry';
import { RcaSectionCard } from '../listagem-a/rca-form-listagem-a-helpers';

export function RcaListagemEFormularioTipoCard({
  form,
  currentTipo,
  onTipoChange,
}: {
  form: UseFormReturn<any>;
  currentTipo: RcaListagemEFormTipo;
  onTipoChange: (tipo: RcaListagemEFormTipo) => void;
}) {
  const trFile = RCA_LISTAGEM_E_TR_FILES[currentTipo];

  return (
    <RcaSectionCard
      title="Tipo de formulário – RCA Listagem E"
      description="Doze fichas para infraestrutura. Rodovias, gasoduto, barragem de saneamento, biogás, biometanização, tratamento térmico e solo urbano possuem TR em termos de referencia/LISTAGEM E/RCA/."
    >
      <FormField
        control={form.control}
        name="formularioTipo"
        render={() => (
          <FormItem>
            <FormLabel>Ficha de elaboração do RCA</FormLabel>
            <Select
              onValueChange={(v) => onTipoChange(v as RcaListagemEFormTipo)}
              value={currentTipo}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(RCA_LISTAGEM_E_FORM_TIPOS) as [RcaListagemEFormTipo, string][]).map(
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
                : 'TR não mapeado — use o formulário geral de infraestrutura ou verifique LISTAGEM E/RCA.'}
            </FormDescription>
          </FormItem>
        )}
      />
    </RcaSectionCard>
  );
}
