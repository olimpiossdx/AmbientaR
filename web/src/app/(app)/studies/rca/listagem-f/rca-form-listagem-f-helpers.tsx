'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { UseFormReturn } from 'react-hook-form';

export function RcaNumField({
  form,
  name,
  label,
  className,
}: {
  form: UseFormReturn<any>;
  name: string;
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
            <Input
              type="number"
              {...field}
              value={field.value === undefined || field.value === null ? '' : String(field.value)}
              onChange={(e) => {
                const raw = e.target.value;
                field.onChange(raw === '' ? '' : Number(raw));
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function RcaCheckboxOptions({
  form,
  name,
  options,
}: {
  form: UseFormReturn<any>;
  name: string;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <FormField
          key={opt.id}
          control={form.control}
          name={`${name}.${opt.id}` as never}
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">{opt.label}</FormLabel>
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
