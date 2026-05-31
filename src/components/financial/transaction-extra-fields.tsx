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
import {
  EXPENSE_CATEGORIES,
  SUPPLIER_NONE_SELECT_VALUE,
} from '@/lib/financial-core';
import type { Contract, Fornecedor, Project, ProjectRoiCase } from '@/lib/types';
import { ProjectRoiCaseSelectField } from '@/components/financial/project-roi-case-select-field';

export const CONTRACT_NONE_SELECT_VALUE = '__contract_none__';
export const PROJECT_NONE_SELECT_VALUE = '__project_none__';

/** Campos opcionais de classificação (receita/despesa no fluxo de caixa). */
export type TransactionExtraFieldsForm = {
  category?: string;
  supplierId?: string;
  requestId?: string;
  projectId?: string;
  centroCusto?: string;
  invoiceId?: string;
  projectRoiCaseId?: string;
  contractId?: string;
  impostoValor?: number;
};

interface TransactionExtraFieldsProps {
  control: Control<TransactionExtraFieldsForm>;
  transactionType: 'revenue' | 'expense';
  suppliers?: Fornecedor[];
  isLoadingSuppliers?: boolean;
  showInvoiceLink?: boolean;
  roiCases?: ProjectRoiCase[];
  isLoadingRoiCases?: boolean;
  contracts?: Contract[];
  isLoadingContracts?: boolean;
  projects?: Project[];
  isLoadingProjects?: boolean;
  onRoiCaseChange?: (caseId: string, selected?: ProjectRoiCase) => void;
}

export function TransactionExtraFields({
  control,
  transactionType,
  suppliers,
  isLoadingSuppliers,
  showInvoiceLink,
  roiCases,
  isLoadingRoiCases,
  contracts,
  isLoadingContracts,
  projects,
  isLoadingProjects,
  onRoiCaseChange,
}: TransactionExtraFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 border rounded-md p-4 bg-muted/30">
      <p className="sm:col-span-2 text-sm font-medium text-muted-foreground">
        Classificação e centro de custo (opcional)
      </p>

      <ProjectRoiCaseSelectField
        control={control}
        name="projectRoiCaseId"
        cases={roiCases}
        isLoading={isLoadingRoiCases}
      />

      {transactionType === 'revenue' && (
        <FormField
          control={control}
          name="contractId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contrato cliente (opcional)</FormLabel>
              <Select
                onValueChange={(v) => {
                  const id = v === CONTRACT_NONE_SELECT_VALUE ? '' : v;
                  field.onChange(id);
                  if (id && roiCases) {
                    const match = roiCases.find((c) => c.contractId === id);
                    if (match && onRoiCaseChange) onRoiCaseChange(match.id, match);
                  }
                }}
                value={
                  field.value ? field.value : CONTRACT_NONE_SELECT_VALUE
                }
                disabled={isLoadingContracts}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={CONTRACT_NONE_SELECT_VALUE}>
                    — Nenhum —
                  </SelectItem>
                  {contracts?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.sourceProposalNumber || c.objeto?.empreendimento || c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {transactionType === 'expense' && (
        <>
          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ? field.value : undefined}
                >
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
                  onValueChange={(v) =>
                    field.onChange(
                      v === SUPPLIER_NONE_SELECT_VALUE ? '' : v,
                    )
                  }
                  value={
                    field.value
                      ? field.value
                      : SUPPLIER_NONE_SELECT_VALUE
                  }
                  disabled={isLoadingSuppliers}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SUPPLIER_NONE_SELECT_VALUE}>
                      — Nenhum —
                    </SelectItem>
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
          <FormField
            control={control}
            name="impostoValor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor imposto nesta despesa (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Opcional"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
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
        name="projectId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Empreendimento (opcional)</FormLabel>
            <Select
              onValueChange={(v) =>
                field.onChange(v === PROJECT_NONE_SELECT_VALUE ? '' : v)
              }
              value={field.value ? field.value : PROJECT_NONE_SELECT_VALUE}
              disabled={isLoadingProjects}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={PROJECT_NONE_SELECT_VALUE}>
                  — Nenhum —
                </SelectItem>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.propertyName || p.fantasyName || p.id}
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
