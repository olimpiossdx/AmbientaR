"use client";

import type { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export type MtrIntegracaoFormValues = {
  mtrPessoaCodigo?: string;
  mtrUsuarioCpf?: string;
  mtrSenha?: string;
  mtrAutoSyncEnabled?: boolean;
  mtrAutoBaixarPdf?: boolean;
  mtrAutoSyncIntervalHours?: string;
};

type MtrIntegracaoFieldsProps = {
  control: Control<MtrIntegracaoFormValues>;
  showLastSync?: {
    lastSyncAt?: string;
    lastSyncSummary?: string;
    lastSyncError?: string;
  };
};

export function MtrIntegracaoFields({
  control,
  showLastSync,
}: MtrIntegracaoFieldsProps) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <div>
        <h3 className="text-lg font-medium">Integração MTR-MG</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Credenciais do Sistema MTR (SEMAD/FEAM) para buscar CDFs e manifestos
          automaticamente em{" "}
          <Link href="/mtr-declaracao" className="text-primary underline">
            Documentos Ambientais → MTR-Declaração
          </Link>
          . Deixe a senha em branco ao editar para manter a atual.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="mtrPessoaCodigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código da unidade (pessoaCodigo)</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder="Ex.: 4"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="mtrUsuarioCpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF do usuário MTR</FormLabel>
              <FormControl>
                <Input placeholder="Somente números" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="mtrSenha"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Senha MTR</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Armazenada no cadastro do empreendedor para sync automático.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-3">
        <FormField
          control={control}
          name="mtrAutoSyncEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              </FormControl>
              <div>
                <FormLabel className="font-normal">
                  Sincronizar automaticamente com o MTR-MG
                </FormLabel>
                <FormDescription>
                  Consulta CDFs e manifestos dos últimos 30 dias no intervalo
                  configurado (mín. 6 h).
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="mtrAutoBaixarPdf"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              </FormControl>
              <div>
                <FormLabel className="font-normal">
                  Baixar PDF automaticamente após sync
                </FormLabel>
                <FormDescription>
                  Até 8 PDFs por execução (CDF e manifesto).
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="mtrAutoSyncIntervalHours"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Intervalo entre syncs (horas)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={6}
                  max={168}
                  placeholder="24"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {showLastSync?.lastSyncAt && (
        <p className="text-xs text-muted-foreground">
          Última sync:{" "}
          {new Date(showLastSync.lastSyncAt).toLocaleString("pt-BR")}
          {showLastSync.lastSyncSummary
            ? ` — ${showLastSync.lastSyncSummary}`
            : ""}
        </p>
      )}
      {showLastSync?.lastSyncError && (
        <p className="text-xs text-destructive">
          Último erro: {showLastSync.lastSyncError}
        </p>
      )}
    </div>
  );
}
