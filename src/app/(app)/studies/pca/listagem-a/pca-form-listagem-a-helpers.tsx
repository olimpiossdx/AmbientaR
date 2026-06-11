'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import type { UseFormReturn } from 'react-hook-form';

export type PcaFieldPath = string;

export function PcaSectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function PcaTextField({
  form,
  name,
  label,
  className,
  placeholder,
}: {
  form: UseFormReturn<any>;
  name: PcaFieldPath;
  label: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} value={String(field.value ?? '')} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function PcaTextAreaField({
  form,
  name,
  label,
  placeholder,
}: {
  form: UseFormReturn<any>;
  name: PcaFieldPath;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea placeholder={placeholder} {...field} value={String(field.value ?? '')} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function PcaBooleanRadio({
  form,
  name,
  label,
}: {
  form: UseFormReturn<any>;
  name: PcaFieldPath;
  label: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={(v) => field.onChange(v === 'true')}
              value={field.value === undefined ? undefined : String(field.value)}
              className="flex gap-4"
            >
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <RadioGroupItem value="true" />
                </FormControl>
                <FormLabel className="font-normal">Sim</FormLabel>
              </FormItem>
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <RadioGroupItem value="false" />
                </FormControl>
                <FormLabel className="font-normal">Não</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function PcaNumField({
  form,
  name,
  label,
  className,
}: {
  form: UseFormReturn<any>;
  name: PcaFieldPath;
  label: string;
  className?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="number" step="any" {...field} value={field.value ?? ''} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function PcaCheckboxOptions({
  form,
  name,
  options,
}: {
  form: UseFormReturn<any>;
  name: PcaFieldPath;
  options: { id: string; label: string }[];
}) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {options.map((opt) => (
              <FormItem key={opt.id} className="flex items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={
                      Array.isArray(field.value) &&
                      (field.value as string[]).includes(opt.id)
                    }
                    onCheckedChange={(checked) => {
                      const current = Array.isArray(field.value) ? field.value : [];
                      field.onChange(
                        checked
                          ? [...current, opt.id]
                          : current.filter((v: string) => v !== opt.id),
                      );
                    }}
                  />
                </FormControl>
                <FormLabel className="font-normal leading-snug">{opt.label}</FormLabel>
              </FormItem>
            ))}
          </div>
        </FormItem>
      )}
    />
  );
}

export function PcaTabelaLinhasFixas({
  form,
  basePath,
  linhas,
  colunas,
}: {
  form: UseFormReturn<any>;
  basePath: string;
  linhas: { id: string; label: string }[];
  colunas: { key: string; label: string; type?: 'text' | 'number' }[];
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-2 text-left font-medium">Nome</th>
            {colunas.map((col) => (
              <th key={col.key} className="p-2 text-left font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.id} className="border-b">
              <td className="p-2 align-top font-medium">{linha.label}</td>
              {colunas.map((col) => (
                <td key={col.key} className="p-2">
                  <FormField
                    control={form.control}
                    name={`${basePath}.${linha.id}.${col.key}` as never}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type={col.type === 'number' ? 'number' : 'text'}
                            step={col.type === 'number' ? 'any' : undefined}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PcaSituacaoRegularizacao({
  form,
  name,
  label,
}: {
  form: UseFormReturn<any>;
  name: string;
  label: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
              {[
                { value: 'regularizada', label: 'Regularizada' },
                { value: 'em_analise', label: 'Em análise' },
                { value: 'nao_regularizada', label: 'Não regularizada' },
              ].map((opt) => (
                <FormItem key={opt.value} className="flex items-center gap-2">
                  <FormControl>
                    <RadioGroupItem value={opt.value} />
                  </FormControl>
                  <FormLabel className="font-normal">{opt.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
