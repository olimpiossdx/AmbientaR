"use client";

import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CoordinateStringField } from "./coordinate-string-field";

type CoordinateStringFormFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  className?: string;
};

/** Campo RHF que persiste coordenadas GMS/UTM numa string legada (`utm`, `coordenadas`, etc.). */
export function CoordinateStringFormField<T extends FieldValues>({
  form,
  name,
  label,
  className,
}: CoordinateStringFormFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <CoordinateStringField
              value={String(field.value ?? "")}
              onChange={field.onChange}
              variant="coords-only"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
