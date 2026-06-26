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
import { SectionCard } from './form-listagem-a-helpers';
import type { ListagemLetter } from './listagem-form-activity';

interface ListagemFormularioTipoCardProps<T extends string> {
  form: any;
  letter: ListagemLetter;
  fieldPath: string;
  formTipos: Record<T, string>;
  defaultTipo: T;
  description: string;
  onTipoChange: (tipo: T) => void;
  currentTipo: T;
}

export function ListagemFormularioTipoCard<T extends string>({
  form,
  letter,
  fieldPath,
  formTipos,
  defaultTipo,
  description,
  onTipoChange,
  currentTipo,
}: ListagemFormularioTipoCardProps<T>) {
  return (
    <SectionCard title={`Tipo de formulário – Listagem ${letter}`}>
      <FormField
        control={form.control}
        name={fieldPath}
        render={() => (
          <FormItem>
            <FormLabel>Ficha de preenchimento</FormLabel>
            <Select onValueChange={(v) => onTipoChange(v as T)} value={currentTipo || defaultTipo}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.entries(formTipos) as [T, string][]).map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>{description}</FormDescription>
          </FormItem>
        )}
      />
    </SectionCard>
  );
}
