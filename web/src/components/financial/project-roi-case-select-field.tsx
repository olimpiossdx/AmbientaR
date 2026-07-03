'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import type { ProjectRoiCase } from '@/lib/types';

export const PROJECT_ROI_CASE_NONE = '__roi_case_none__';

export function roiCaseLabel(c: ProjectRoiCase): string {
  return (
    c.apelido ||
    c.empreendimentoTexto ||
    c.sourceProposalNumber ||
    c.id.slice(0, 8)
  );
}

export function ProjectRoiCaseSelectField<T extends FieldValues>({
  control,
  name,
  cases,
  isLoading,
  disabled,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  cases?: ProjectRoiCase[];
  isLoading?: boolean;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Projeto & ROI (opcional)</FormLabel>
          <Select
            disabled={disabled || isLoading}
            onValueChange={(v) =>
              field.onChange(v === PROJECT_ROI_CASE_NONE ? '' : v)
            }
            value={field.value ? field.value : PROJECT_ROI_CASE_NONE}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum — custo geral" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={PROJECT_ROI_CASE_NONE}>
                — Nenhum (controlo geral) —
              </SelectItem>
              {cases
                ?.filter(
                  (c) =>
                    c.statusGovernanca === 'ativo' ||
                    c.statusGovernanca === 'informal',
                )
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {roiCaseLabel(c)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
