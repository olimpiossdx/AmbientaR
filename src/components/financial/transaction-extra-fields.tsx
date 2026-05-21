'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Control } from 'react-hook-form';
import { EXPENSE_CATEGORIES } from '@/lib/financial-core';
import type { Fornecedor } from '@/lib/types';

export type TransactionExtraFieldsForm = {
  category?: string;
  supplierId?: string;
  requestId?: string;
  projectId?: string;
  centroCusto?: string;
  invoiceId?: string;
};

interface TransactionExtraFieldsProps {
  control: Control<TransactionExtraFieldsForm>;
  transactionType: 'revenue' | 'expense';
  suppliers?: Fornecedor[];
  isLoadingSuppliers?: boolean;
  showInvoiceLink?: boolean;
}

export function TransactionExtraFields({
  control,
  transactionType,
  suppliers,
  isLoadingSuppliers,
  showInvoiceLink,
}: TransactionExtraFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 border rounded-md p-4 bg-muted/30">
      <p className="sm:col-span-2 text-sm font-medium text-muted-foreground">
        Classificação e centro de custo (opcional)
      </p>
      {transactionType === 'expense' && (
        <>
          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={isLoadingSuppliers}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">— Nenhum —</SelectItem>
                    {suppliers?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name || s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
      {showInvoiceLink && transactionType === 'revenue' && (
        <FormField
          control={control}
          name="invoiceId"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>ID da fatura vinculada</FormLabel>
              <FormControl>
                <Input placeholder="Preenchido automaticamente ao registrar de fatura paga" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        control={control}
        name="requestId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Processo (requestId)</FormLabel>
            <FormControl>
              <Input placeholder="ID do processo ambiental" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="projectId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Empreendimento (projectId)</FormLabel>
            <FormControl>
              <Input placeholder="ID do empreendimento" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="centroCusto"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Centro de custo</FormLabel>
            <FormControl>
              <Input placeholder="Ex.: EIA-2024-Cliente X" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
