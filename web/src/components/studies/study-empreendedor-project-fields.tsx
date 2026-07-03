'use client';

import * as React from 'react';
import type { FieldPath, UseFormReturn } from 'react-hook-form';
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
import { useEmpreendedorProjectSelect } from '@/hooks/use-empreendedor-project-select';
import { cn } from '@/lib/utils';

export type StudyEmpreendedorFieldPath =
  | 'requerente.clientId'
  | 'empreendedorId'
  | 'empreendedor.clientId';

export type StudyEmpreendedorProjectFieldsProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  form: UseFormReturn<T>;
  empreendedorName?: StudyEmpreendedorFieldPath;
  projectName?: FieldPath<T>;
  empreendedorLabel?: string;
  projectLabel?: string;
  linkedEmpreendedorId?: string | null;
  linkedProjectId?: string | null;
  disabled?: boolean;
  className?: string;
  showEmpreendedor?: boolean;
  showProject?: boolean;
};

export function StudyEmpreendedorProjectFields<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  form,
  empreendedorName = 'requerente.clientId',
  projectName = 'empreendimento.projectId' as FieldPath<T>,
  empreendedorLabel = 'Empreendedor cadastrado',
  projectLabel = 'Empreendimento cadastrado',
  linkedEmpreendedorId,
  linkedProjectId,
  disabled = false,
  className,
  showEmpreendedor = true,
  showProject = true,
}: StudyEmpreendedorProjectFieldsProps<T>) {
  const empreendedorField = empreendedorName as FieldPath<T>;
  const projectField = projectName;

  const empreendedorId = (form.watch(empreendedorField) as string) ?? '';
  const projectId = (form.watch(projectField) as string) ?? '';

  const {
    empreendedoresForSelect,
    projectsForSelect,
    isLoadingEmpreendedores,
    isLoadingProjects,
  } = useEmpreendedorProjectSelect({
    selectedEmpreendedorId: empreendedorId,
    selectedProjectId: projectId,
    linkedEmpreendedorId: linkedEmpreendedorId ?? empreendedorId,
    linkedProjectId: linkedProjectId ?? projectId,
  });

  const prevEmpreendedorRef = React.useRef(empreendedorId);

  React.useEffect(() => {
    if (
      prevEmpreendedorRef.current &&
      prevEmpreendedorRef.current !== empreendedorId
    ) {
      form.setValue(projectField, '' as never);
    }
    prevEmpreendedorRef.current = empreendedorId;
  }, [empreendedorId, form, projectField]);

  React.useEffect(() => {
    const pid = form.getValues(projectField) as string | undefined;
    if (!empreendedorId) {
      if (pid) form.setValue(projectField, '' as never);
      return;
    }
    if (
      pid &&
      projectsForSelect.length > 0 &&
      !projectsForSelect.some((p) => p.id === pid)
    ) {
      form.setValue(projectField, '' as never);
    }
  }, [empreendedorId, projectsForSelect, form, projectField]);

  return (
    <div className={cn('space-y-4', className)}>
      {showEmpreendedor && (
      <FormField
        control={form.control}
        name={empreendedorField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{empreendedorLabel}</FormLabel>
            <Select
              value={(field.value as string) || ''}
              onValueChange={field.onChange}
              disabled={disabled || isLoadingEmpreendedores}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingEmpreendedores ? 'Carregando…' : 'Selecione o empreendedor'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {empreendedoresForSelect.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      )}

      {showProject && (
      <FormField
        control={form.control}
        name={projectField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{projectLabel}</FormLabel>
            <Select
              value={(field.value as string) || ''}
              onValueChange={field.onChange}
              disabled={
                disabled || isLoadingProjects || !empreendedorId
              }
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !empreendedorId
                        ? 'Selecione um empreendedor primeiro'
                        : isLoadingProjects
                          ? 'Carregando…'
                          : 'Selecione o empreendimento'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {projectsForSelect.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.propertyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      )}
    </div>
  );
}
